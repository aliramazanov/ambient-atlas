<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		ANTHRO_SUBCATS,
		anthroSubOf,
		categoryColor,
		CATEGORIES,
		CERTAINTY_LABEL,
		TIERS
	} from '$lib/data/scales/categories';
	import { countryByIso3 } from '$lib/data/places/countries';
	import { dots, researchOf, severityOf } from '$lib/data/scales/severity';
	import { statusOf } from '$lib/data/scales/status';
	import { zoneRadiusDeg } from '$lib/data/scales/reach';
	import { METRICS, METRIC_BY_KEY, metricColor } from '$lib/data/places/metrics';
	import { cities } from '$lib/data/generated/places';
	import { air, aqiColor, ensureAirData } from '$lib/state/air-quality.svelte';
	import type { Tier, Zone } from '$lib/data/zones/types';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import {
		geoArea,
		geoCentroid,
		geoGraticule10,
		geoMercator,
		geoPath,
		geoCircle,
		geoContains
	} from 'd3-geo';
	import { angularDistanceDeg } from '$lib/utils/geo';
	import type { CountryFeature } from '$lib/data/places/countries';

	const W = 960;
	const H = 620;

	const info = $derived(countryByIso3(page.params.id ?? ''));

	// Plain-language gloss for each shading metric, so the color has meaning.
	const METRIC_DESC: Record<string, string> = {
		life: 'Average years a newborn is expected to live.',
		hdi: 'UN Human Development Index: health, schooling and income combined, 0 to 1.',
		income: 'Gross national income per person, adjusted for purchasing power.',
		gini: 'Income inequality: 0 is perfectly equal, 100 is maximally unequal.',
		homicide: 'Intentional homicides per 100,000 people per year.',
		calm: 'Composite of good-society indicators, minus a penalty for nearby mapped hazards.'
	};

	// Local view controls (independent of the globe so toggling here never mutates
	// the user's global filters).
	let tierOn = $state<Record<Tier, boolean>>({
		established: true,
		gray: true,
		solved: true,
		anthropogenic: true,
		conflict: true,
		climate: true
	});
	const establishedCats = CATEGORIES.filter((c) => c.tier === 'established');
	let catOn = $state<Record<string, boolean>>(
		Object.fromEntries([...establishedCats, ...ANTHRO_SUBCATS].map((c) => [c.key, true]))
	);
	let showReach = $state(false);
	let showAir = $state(false);
	let metric = $state<string>('none');
	const metricOptions = [
		{ value: 'none', label: 'No shading' },
		...METRICS.map((m) => ({ value: m.key, label: m.label }))
	];

	$effect(() => {
		if (showAir) ensureAirData();
	});

	// Frame to the main landmass. For countries with distant territories (US with
	// Alaska/Hawaii, France with overseas departments), fitting the whole
	// multipolygon shrinks the mainland to a dot; a country profile does not need
	// the true geographic spread, so we fit to the largest polygon and let the far
	// pieces clip out of view.
	function framingFeature(feat: CountryFeature): CountryFeature {
		const g = feat.geometry;
		if (g.type !== 'MultiPolygon' || g.coordinates.length < 2) return feat;
		const polys = g.coordinates.map((poly) => {
			const f = { type: 'Polygon' as const, coordinates: poly };
			return { poly, area: geoArea(f), c: geoCentroid(f) };
		});
		polys.sort((a, b) => b.area - a.area);
		const main = polys[0];
		// Keep the main landmass plus any island clustered near it (so an
		// archipelago like Japan stays whole), but drop far-flung outliers (US
		// Alaska/Hawaii, French overseas departments) that would otherwise shrink
		// the mainland to a dot.
		const NEAR_DEG = 14;
		const kept = polys.filter(
			(p) => p === main || angularDistanceDeg(main.c[1], main.c[0], p.c[1], p.c[0]) <= NEAR_DEG
		);
		return { ...feat, geometry: { type: 'MultiPolygon', coordinates: kept.map((k) => k.poly) } };
	}

	const frame = $derived(info ? framingFeature(info.feature) : null);
	const projection = $derived.by(() => {
		if (!frame) return null;
		return geoMercator().fitExtent(
			[
				[40, 40],
				[W - 40, H - 40]
			],
			frame
		);
	});
	const path = $derived(projection ? geoPath(projection) : null);
	const shape = $derived(path && frame ? (path(frame) ?? '') : '');
	const grat = $derived(path ? (path(geoGraticule10()) ?? '') : '');
	const centroid = $derived(path && frame ? path.centroid(frame) : null);

	function zoneVisible(z: Zone): boolean {
		if (!tierOn[z.tier]) return false;
		if (z.tier === 'established' && !catOn[z.category]) return false;
		if (z.tier === 'anthropogenic' && !catOn[anthroSubOf(z)]) return false;
		return true;
	}
	const visibleZones = $derived(info ? info.zones.filter(zoneVisible) : []);

	// Push overlapping markers apart so co-located exposures (e.g. the cluster
	// around Baku) stay individually visible and clickable instead of stacking
	// into a blob. A few relaxation passes are plenty for the handful of marks a
	// country has. Works the same for every country, no per-country tuning.
	function spreadMarks<T extends { x: number; y: number }>(pts: T[]): T[] {
		const out = pts.map((p) => ({ ...p }));
		const MIN = 14;
		for (let iter = 0; iter < 80; iter++) {
			let moved = false;
			for (let i = 0; i < out.length; i++) {
				for (let j = i + 1; j < out.length; j++) {
					let dx = out[j].x - out[i].x;
					let dy = out[j].y - out[i].y;
					let d = Math.hypot(dx, dy);
					if (d < 0.01) {
						// Identical points: fan them out along the golden angle (deterministic).
						const a = j * 2.399;
						dx = Math.cos(a);
						dy = Math.sin(a);
						d = 1;
					}
					if (d < MIN) {
						const push = (MIN - d) / 2;
						const ux = dx / d;
						const uy = dy / d;
						out[i].x -= ux * push;
						out[i].y -= uy * push;
						out[j].x += ux * push;
						out[j].y += uy * push;
						moved = true;
					}
				}
			}
			if (!moved) break;
		}
		for (const p of out) {
			p.x = Math.max(10, Math.min(W - 10, p.x));
			p.y = Math.max(10, Math.min(H - 10, p.y));
		}
		return out;
	}

	const marks = $derived.by(() => {
		const proj = projection;
		if (!proj) return [];
		const raw = visibleZones.flatMap((z) => {
			const p = proj([z.lng, z.lat]);
			return p ? [{ z, x: p[0], y: p[1], color: categoryColor(z) }] : [];
		});
		return spreadMarks(raw);
	});

	const reachPaths = $derived.by(() => {
		const p = path;
		if (!p || !showReach) return [];
		return visibleZones.flatMap((z) => {
			const d = p(geoCircle().center([z.lng, z.lat]).radius(zoneRadiusDeg(z))());
			return d ? [{ id: z.id, d, color: categoryColor(z) }] : [];
		});
	});

	const cityMarks = $derived.by(() => {
		const proj = projection;
		if (!info || !proj) return [];
		const ranked = cities
			.map((c, i) => ({ c, i }))
			.filter(({ c }) => geoContains(info.feature, [c.lng, c.lat]))
			.sort(
				(a, b) =>
					(b.c.significant ? 1e9 : 0) + (b.c.capital ? 5e8 : 0) + b.c.pop -
					((a.c.significant ? 1e9 : 0) + (a.c.capital ? 5e8 : 0) + a.c.pop)
			);
		// Show more cities, but declutter to one per screen cell and drop any that
		// project outside the framed view (e.g. cities in dropped territories).
		const out: { name: string; x: number; y: number; capital: boolean; idx: number }[] = [];
		const occupied = new Set<string>();
		for (const { c, i } of ranked) {
			const p = proj([c.lng, c.lat]);
			if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
			const cell = `${Math.round(p[0] / 66)},${Math.round(p[1] / 26)}`;
			if (occupied.has(cell)) continue;
			occupied.add(cell);
			out.push({ name: c.name, x: p[0], y: p[1], capital: !!c.capital, idx: i });
			if (out.length >= 26) break;
		}
		return out;
	});

	const metricMeta = $derived(metric !== 'none' ? (METRIC_BY_KEY[metric] ?? null) : null);
	const metricValue = $derived(info && metricMeta ? metricMeta.map[info.iso3] : undefined);
	// Position of this country's value on the worse-to-better legend (0 = worse).
	const shadeT = $derived.by(() => {
		if (!metricMeta || metricValue == null) return null;
		const [lo, hi] = metricMeta.domain;
		let t = hi === lo ? 0.5 : (metricValue - lo) / (hi - lo);
		t = Math.max(0, Math.min(1, t));
		return metricMeta.higherBetter ? t : 1 - t;
	});
	const landFill = $derived(
		metricMeta && metricValue != null ? metricColor(metricMeta, metricValue) : '#16273f'
	);

	let openId = $state<string | null>(null);
	const selected = $derived(marks.find((m) => m.z.id === openId) ?? null);

	function selectZone(id: string) {
		openId = openId === id ? null : id;
	}
</script>

<svelte:head><title>Ambient Atlas: {info?.name ?? 'Country'}</title></svelte:head>

<main>
	<header class="topbar">
		<a class="back" href={resolve('/')}><Icon name="globe" size={14} /> Globe</a>
		{#if info}
			<div class="title">
				<h1>{info.name}</h1>
				<span class="count"
					>{info.zones.length} mapped exposure{info.zones.length === 1 ? '' : 's'}</span
				>
			</div>
		{/if}
	</header>

	{#if !info}
		<div class="empty">
			<h1>Country not found</h1>
			<p>No mapped data for this country code.</p>
		</div>
	{:else}
		<div class="grid">
			<!-- Controls (left) -->
			<aside class="panel controls">
				<section class="group">
					<span class="label">Overlays</span>
					<label class="switch">
						<input type="checkbox" bind:checked={showReach} />
						<span>Reach areas</span>
					</label>
					<label class="switch">
						<input type="checkbox" bind:checked={showAir} />
						<span>Air quality{showAir && air.status === 'loading' ? ' (loading)' : ''}</span>
					</label>
				</section>

				<section class="group">
					<span class="label">Country shading</span>
					<Select id="metric" label="Country shading" bind:value={metric} options={metricOptions} />
					{#if metricMeta}
						<div class="shade">
							<div class="shade-top">
								{#if metricValue != null}
									<span class="shade-val"
										>{metricMeta.format(metricValue)}{metricMeta.unit
											? ` ${metricMeta.unit}`
											: ''}</span
									>
								{:else}
									<span class="shade-val none">No data</span>
								{/if}
								<span class="dir" class:good={metricMeta.higherBetter}>
									<Icon name={metricMeta.higherBetter ? 'plus' : 'minus'} size={11} />
									{metricMeta.higherBetter ? 'Higher is better' : 'Lower is better'}
								</span>
							</div>
							<p class="shade-desc">{METRIC_DESC[metric] ?? ''}</p>
							<div class="ramp">
								{#if shadeT != null}
									<span class="pin" style="left:{shadeT * 100}%"></span>
								{/if}
							</div>
							<div class="ramp-ends"><span>Worse</span><span>Better</span></div>
							{#if metricMeta.source !== 'composite'}
								<div class="shade-src">{metricMeta.source}{metricMeta.year ? `, ${metricMeta.year}` : ''}</div>
							{/if}
						</div>
					{/if}
				</section>

				<section class="group">
					<span class="label">Layers</span>
					<div class="layers">
						{#each TIERS as t (t.key)}
							<button
								class="tier"
								class:off={!tierOn[t.key]}
								aria-pressed={tierOn[t.key]}
								onclick={() => (tierOn[t.key] = !tierOn[t.key])}
							>
								{t.label}
							</button>
							{#if t.key === 'established' && tierOn.established}
								<div class="subchips">
									{#each establishedCats as c (c.key)}
										<button
											class="subchip"
											class:off={!catOn[c.key]}
											aria-pressed={catOn[c.key]}
											onclick={() => (catOn[c.key] = !catOn[c.key])}
										>
											<span class="sw" style="background:{c.color}"></span>{c.label}
										</button>
									{/each}
								</div>
							{/if}
							{#if t.key === 'anthropogenic' && tierOn.anthropogenic}
								<div class="subchips">
									{#each ANTHRO_SUBCATS as c (c.key)}
										<button
											class="subchip"
											class:off={!catOn[c.key]}
											aria-pressed={catOn[c.key]}
											onclick={() => (catOn[c.key] = !catOn[c.key])}
										>
											<span class="sw" style="background:{c.color}"></span>{c.label}
										</button>
									{/each}
								</div>
							{/if}
						{/each}
					</div>
				</section>
			</aside>

			<!-- Map (center) -->
			<section class="mapcol">
				<svg
					viewBox="0 0 {W} {H}"
					preserveAspectRatio="xMidYMid meet"
					onclick={() => (openId = null)}
					role="presentation"
				>
					<path d={grat} class="grat" />
					<path d={shape} class="land" style="fill:{landFill}" />
					{#if metricMeta && metricValue != null && centroid}
						<g class="shade-readout">
							<text x={centroid[0]} y={centroid[1]} class="sr-val"
								>{metricMeta.format(metricValue)}{metricMeta.unit
									? ` ${metricMeta.unit}`
									: ''}</text
							>
							<text x={centroid[0]} y={centroid[1] + 18} class="sr-lab">{metricMeta.label}</text>
						</g>
					{/if}
					{#each reachPaths as r (r.id)}
						<path
							d={r.d}
							class="reach-area"
							class:dim={openId !== null && openId !== r.id}
							style="fill:{r.color}; stroke:{r.color}"
						/>
					{/each}
					{#each cityMarks as c (c.name + c.x)}
						{@const v = showAir && air.status === 'ready' ? air.aqi[c.idx] : null}
						<g class="city">
							<circle cx={c.x} cy={c.y} r="1.7" />
							<text x={c.x + 5} y={c.y + 3} class:cap={c.capital}>{c.name}</text>
							{#if v != null}
								{@const t = String(Math.round(v))}
								{@const w = 13 + t.length * 6.5}
								<g class="aqi-badge" transform="translate({c.x + 5}, {c.y + 8})">
									<rect width={w} height="15" rx="7.5" fill={aqiColor(v)} />
									<text x={w / 2} y="11">{t}</text>
								</g>
							{/if}
						</g>
					{/each}
					{#each marks as m (m.z.id)}
						<circle
							class="mark"
							class:active={openId === m.z.id}
							cx={m.x}
							cy={m.y}
							r={openId === m.z.id ? 8 : 5.5}
							fill={m.color}
							stroke="#0a0f1a"
							stroke-width="1.4"
							role="button"
							tabindex="0"
							aria-label={m.z.name}
							onclick={(e) => {
								e.stopPropagation();
								selectZone(m.z.id);
							}}
							onkeydown={(e) => {
								if (e.key === 'Enter' || e.key === ' ') {
									e.preventDefault();
									selectZone(m.z.id);
								}
							}}
						/>
					{/each}
				</svg>
			</section>

			<!-- Exposures / detail (right) -->
			<aside class="panel side">
				{#if selected}
					{@const z = selected.z}
					{@const st = statusOf(z)}
					<button class="side-back" onclick={() => (openId = null)}>
						<Icon name="chevron" size={12} /> All exposures
					</button>
					<div class="d-head">
						<span class="cdot" style="background:{selected.color}"></span>
						<span class="d-name">{z.name}</span>
					</div>
					<div class="tags">
						<span class="tag" style="color:{st.color}; border-color:{st.color}">{st.label}</span>
						<span class="tag muted">{z.category}</span>
						{#if z.certainty}<span class="tag muted">{CERTAINTY_LABEL[z.certainty]}</span>{/if}
					</div>
					<p class="desc">{z.desc}</p>
					<p class="health"><b>Health.</b> {z.health}</p>
					<div class="sr">severity {dots(severityOf(z))} · researched {dots(researchOf(z))}</div>
					{#if z.citations?.length}
						<div class="cites">
							{#each z.citations as c (c.url)}
								<a href={c.url} target="_blank" rel="noopener noreferrer">
									<Icon name="link" size={11} /> {c.ref}{c.openAccess ? ' (open)' : ''}
								</a>
							{/each}
						</div>
					{/if}
					<a class="full" href={resolve('/zone/[id]', { id: z.id })}>
						<Icon name="plus" size={12} /> Open full entry
					</a>
				{:else}
					<div class="label side-label">
						Exposures
						<span class="shown"
							>{marks.length}{visibleZones.length !== info.zones.length
								? ` of ${info.zones.length}`
								: ''}</span
						>
					</div>
					{#if marks.length === 0}
						<p class="none">No exposures match the current layers.</p>
					{:else}
						<ul class="list">
							{#each marks as m (m.z.id)}
								<li>
									<button onclick={() => selectZone(m.z.id)}>
										<span class="dot" style="background:{m.color}"></span>
										<span class="lname">{m.z.name}</span>
										<span class="ltier">{m.z.tier}</span>
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				{/if}
			</aside>
		</div>
	{/if}
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		display: flex;
		flex-direction: column;
		background: radial-gradient(130% 115% at 50% 22%, #0c1526 0%, #05070e 78%);
		color: var(--text);
		padding: 16px clamp(14px, 2.5vw, 28px) 18px;
	}

	.topbar {
		display: flex;
		align-items: center;
		gap: 18px;
		flex: none;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		text-decoration: none;
		color: var(--text);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 7px 13px;
		backdrop-filter: blur(var(--blur));
	}
	.back:hover {
		border-color: var(--line-strong);
	}
	.title {
		display: flex;
		align-items: baseline;
		gap: 12px;
		min-width: 0;
	}
	.title h1 {
		font-family: var(--font-display);
		font-size: clamp(20px, 2.6vw, 30px);
		margin: 0;
		letter-spacing: -0.01em;
		white-space: nowrap;
	}
	.count {
		font-size: 13px;
		color: var(--muted);
	}
	.empty {
		text-align: center;
		margin-top: 16vh;
		color: var(--muted);
	}

	/* Three balanced columns: controls, map, exposures. The map is the focal
	   point and fills the middle; the side panels scroll independently. Entrance
	   scales and fades in (transform/opacity only, so it stays on the compositor)
	   to read as a continuous zoom from the globe. */
	.grid {
		flex: 1;
		min-height: 0;
		margin-top: 14px;
		display: grid;
		grid-template-columns: 288px minmax(0, 1fr) 320px;
		gap: clamp(14px, 1.8vw, 26px);
		animation: arrive 460ms cubic-bezier(0.22, 0.68, 0.2, 1) both;
	}
	@keyframes arrive {
		from {
			opacity: 0;
			transform: scale(1.045);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	.panel {
		min-height: 0;
		overflow-y: auto;
		overflow-x: hidden;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 14px 15px;
		backdrop-filter: blur(var(--blur));
		scrollbar-width: thin;
	}
	.group {
		display: block;
	}
	.group + .group {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--line);
	}
	.label {
		display: block;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--muted);
		margin-bottom: 9px;
	}

	.switch {
		display: flex;
		align-items: center;
		gap: 9px;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		padding: 3px 0;
	}
	.switch input {
		width: 15px;
		height: 15px;
		accent-color: var(--accent);
	}

	/* Shading explainer */
	.shade {
		margin-top: 11px;
	}
	.shade-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
	}
	.shade-val {
		font-size: 16px;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.shade-val.none {
		font-size: 13px;
		font-weight: 500;
		color: var(--muted);
	}
	.dir {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 10px;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 999px;
		color: #f0a98b;
		background: rgba(240, 169, 139, 0.12);
	}
	.dir.good {
		color: #7fd6a3;
		background: rgba(127, 214, 163, 0.12);
	}
	.shade-desc {
		margin: 9px 0 11px;
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--muted);
	}
	.ramp {
		position: relative;
		height: 8px;
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			rgb(179, 135, 155),
			rgb(177, 153, 189),
			rgb(159, 177, 204),
			rgb(166, 204, 191),
			rgb(210, 220, 171)
		);
	}
	.pin {
		position: absolute;
		top: 50%;
		width: 11px;
		height: 11px;
		border-radius: 50%;
		background: #fff;
		border: 2px solid #05070e;
		transform: translate(-50%, -50%);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);
	}
	.ramp-ends {
		display: flex;
		justify-content: space-between;
		margin-top: 5px;
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}
	.shade-src {
		margin-top: 9px;
		font-size: 10.5px;
		color: var(--muted);
	}

	/* Layers */
	.layers {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
	}
	.tier {
		font-size: 11.5px;
		font-weight: 600;
		color: var(--text);
		background: var(--accent-soft);
		border: 1px solid var(--accent);
		border-radius: 999px;
		padding: 4px 11px;
		cursor: pointer;
		transition: background 120ms ease;
	}
	.tier.off {
		color: var(--muted);
		background: transparent;
		border-color: var(--line);
	}
	.subchips {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin: 0 0 4px 10px;
	}
	.subchip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 10.5px;
		font-weight: 500;
		color: var(--text);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 3px 8px;
		cursor: pointer;
	}
	.subchip.off {
		color: var(--muted);
		opacity: 0.5;
	}
	.subchip .sw {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex: none;
	}
	.subchip.off .sw {
		filter: grayscale(1);
	}

	/* Map */
	.mapcol {
		min-width: 0;
		min-height: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	svg {
		width: 100%;
		height: 100%;
		display: block;
	}
	.grat {
		fill: none;
		stroke: rgba(120, 150, 200, 0.08);
		stroke-width: 0.5;
	}
	.land {
		stroke: rgba(140, 175, 220, 0.4);
		stroke-width: 1;
		transition: fill 220ms ease;
	}
	.shade-readout {
		pointer-events: none;
	}
	.sr-val {
		text-anchor: middle;
		font-size: 30px;
		font-weight: 800;
		fill: #141d33;
		paint-order: stroke;
		stroke: rgba(255, 255, 255, 0.5);
		stroke-width: 4px;
		stroke-linejoin: round;
		font-variant-numeric: tabular-nums;
	}
	.sr-lab {
		text-anchor: middle;
		font-size: 11px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		fill: rgba(20, 29, 51, 0.82);
		paint-order: stroke;
		stroke: rgba(255, 255, 255, 0.45);
		stroke-width: 2.5px;
		stroke-linejoin: round;
	}
	.reach-area {
		fill-opacity: 0.1;
		stroke-opacity: 0.5;
		stroke-width: 1;
		transition: fill-opacity 150ms ease;
		pointer-events: none;
	}
	.reach-area.dim {
		fill-opacity: 0.04;
		stroke-opacity: 0.2;
	}
	.city circle {
		fill: rgba(220, 230, 245, 0.55);
	}
	.city text {
		font-size: 10px;
		fill: rgba(220, 230, 245, 0.62);
		paint-order: stroke;
		stroke: #05070e;
		stroke-width: 2.4px;
		stroke-linejoin: round;
	}
	.city text.cap {
		fill: #d9b46a;
		font-weight: 600;
	}
	.aqi-badge rect {
		stroke: rgba(0, 0, 0, 0.4);
		stroke-width: 1;
		filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
	}
	.aqi-badge text {
		text-anchor: middle;
		font-size: 9.5px;
		font-weight: 800;
		fill: #0b1320;
		stroke: none;
		font-variant-numeric: tabular-nums;
	}
	.mark {
		cursor: pointer;
		transition:
			r 120ms ease,
			filter 120ms ease;
	}
	.mark:hover {
		filter: brightness(1.25);
	}
	/* The selected dot breathes slowly to call out its place on the map.
	   transform-box: fill-box scales it about its own center, not the SVG origin. */
	.mark.active {
		transform-box: fill-box;
		transform-origin: center;
		animation: breathe 1.8s ease-in-out infinite;
	}
	@keyframes breathe {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.32);
		}
	}

	/* Right side panel */
	.side-label {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
	}
	.shown {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0;
		text-transform: none;
		color: var(--text);
	}
	.none {
		color: var(--muted);
		font-size: 13px;
		margin: 4px 0;
	}
	.list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.list button {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 9px;
		text-align: left;
		font-size: 12.5px;
		color: var(--text);
		background: transparent;
		border: 1px solid transparent;
		border-radius: 9px;
		padding: 8px 9px;
		cursor: pointer;
		transition:
			background 120ms ease,
			border-color 120ms ease;
	}
	.list button:hover {
		background: rgba(255, 255, 255, 0.04);
		border-color: var(--line);
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
	}
	.lname {
		flex: 1;
		line-height: 1.3;
	}
	.ltier {
		color: var(--muted);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		flex: none;
	}

	.side-back {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
		font-weight: 600;
		color: var(--muted);
		background: none;
		border: none;
		padding: 0 0 10px;
		cursor: pointer;
	}
	.side-back:hover {
		color: var(--text);
	}
	.d-head {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.cdot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		flex: none;
	}
	.d-name {
		font-weight: 700;
		font-size: 14px;
		line-height: 1.25;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin: 9px 0 2px;
	}
	.tag {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 2px 7px;
		color: var(--muted);
	}
	.tag.muted {
		color: var(--muted);
	}
	.desc {
		margin: 11px 0 0;
		font-size: 12.5px;
		line-height: 1.55;
		color: #d7e0ee;
	}
	.health {
		margin: 9px 0 0;
		font-size: 12.5px;
		line-height: 1.55;
		color: var(--muted);
	}
	.sr {
		margin-top: 10px;
		font-size: 11px;
		letter-spacing: 0.4px;
		color: #a9b6c9;
	}
	.cites {
		margin-top: 10px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	}
	.cites a {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
	}
	.full {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 13px;
		font-size: 12px;
		font-weight: 600;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid var(--accent);
		border-radius: 8px;
		padding: 6px 11px;
		text-decoration: none;
	}

	/* Tablet: drop the right list under the map, keep controls on the left. */
	@media (max-width: 1100px) {
		.grid {
			grid-template-columns: 270px minmax(0, 1fr);
			grid-template-rows: minmax(0, 1fr) auto;
		}
		.controls {
			grid-row: 1 / span 2;
		}
		.side {
			max-height: 280px;
		}
	}
	/* Phone: single column, map first. */
	@media (max-width: 720px) {
		main {
			position: absolute;
			min-height: 100%;
		}
		.grid {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: none;
		}
		.controls {
			grid-row: auto;
		}
		.mapcol {
			min-height: 56vh;
		}
		.side {
			max-height: none;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.grid {
			animation: none;
		}
	}
</style>

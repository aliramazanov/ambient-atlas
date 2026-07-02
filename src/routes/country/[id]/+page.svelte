<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import { cities } from '$lib/data/generated/places';
	import type { CountryFeature } from '$lib/data/places/countries';
	import { countryByIso3 } from '$lib/data/places/countries';
	import { METRICS, METRIC_BY_KEY, metricColor } from '$lib/data/places/metrics';
	import {
	  ANTHRO_SUBCATS,
	  CATEGORIES,
	  CERTAINTY_LABEL,
	  TIERS,
	  anthroSubOf,
	  categoryColor
	} from '$lib/data/scales/categories';
	import { zoneRadiusDeg } from '$lib/data/scales/reach';
	import { dots, researchOf, severityOf } from '$lib/data/scales/severity';
	import { statusOf } from '$lib/data/scales/status';
	import { HEALTH } from '$lib/data/zones/health';
	import type { EmissionType, Tier, Zone } from '$lib/data/zones/types';
	import { air, aqiColor, ensureAirData } from '$lib/state/air-quality.svelte';
	import { angularDistanceDeg } from '$lib/utils/geo';
	import {
	  geoArea,
	  geoCentroid,
	  geoCircle,
	  geoContains,
	  geoGraticule10,
	  geoMercator,
	  geoPath
	} from 'd3-geo';

	const W = 960;
	const H = 620;

	const EMISSION_LABEL: Record<EmissionType, string> = {
		ionizing: 'Ionizing radiation',
		rf: 'Radio-frequency / microwave',
		chemical: 'Chemical / geochemical',
		mixed: 'Mixed'
	};

	const info = $derived(countryByIso3(page.params.id ?? ''));

	const METRIC_DESC: Record<string, string> = {
		life: 'Average years a newborn is expected to live.',
		hdi: 'UN Human Development Index: health, schooling and income combined, 0 to 1.',
		income: 'Gross national income per person, adjusted for purchasing power.',
		gini: 'Income inequality: 0 is perfectly equal, 100 is maximally unequal.',
		homicide: 'Intentional homicides per 100,000 people per year.',
		calm: 'Composite of good-society indicators, minus a penalty for nearby mapped hazards.'
	};


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


	function framingFeature(feat: CountryFeature): CountryFeature {
		const g = feat.geometry;
		if (g.type !== 'MultiPolygon' || g.coordinates.length < 2) return feat;

		const polys = g.coordinates.map((poly) => {
			const f = { type: 'Polygon' as const, coordinates: poly };
			return { poly, area: geoArea(f), c: geoCentroid(f) };
		});

		polys.sort((a, b) => b.area - a.area);
		const main = polys[0];

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


	type Mark = { z: Zone; x: number; y: number; color: string };

	const marks = $derived.by(() => {
		const proj = projection;
		if (!proj) return [];
		return visibleZones.flatMap((z) => {
			const p = proj([z.lng, z.lat]);
			return p ? [{ z, x: p[0], y: p[1], color: categoryColor(z) }] : [];
		});
	});

	type Cluster = { id: string; items: Mark[]; cx: number; cy: number };
	const clusters = $derived.by(() => {
		const R = 13;
		const out: Cluster[] = [];

		for (const m of marks) {
			let placed = false;
			for (const cl of out) {
				if (Math.hypot(m.x - cl.cx, m.y - cl.cy) < R) {
					cl.items.push(m);
					cl.cx = cl.items.reduce((s, i) => s + i.x, 0) / cl.items.length;
					cl.cy = cl.items.reduce((s, i) => s + i.y, 0) / cl.items.length;
					placed = true;
					break;
				}
			}
			if (!placed) out.push({ id: m.z.id, items: [m], cx: m.x, cy: m.y });
		}

		return out;
	});

	let hoveredCluster = $state<string | null>(null);

	function fanRadius(n: number): number {
		return Math.max(14, n * 2.6);
	}
	function fanned(cl: Cluster): { m: Mark; x: number; y: number }[] {
		const n = cl.items.length;
		const radius = fanRadius(n);
		return cl.items.map((m, k) => {
			const a = (k / n) * Math.PI * 2 - Math.PI / 2;
			return { m, x: cl.cx + Math.cos(a) * radius, y: cl.cy + Math.sin(a) * radius };
		});
	}

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

	function luminance(rgb: string): number {
		const m = rgb.match(/\d+(?:\.\d+)?/g);
		if (!m || m.length < 3) return 1;
		const [r, g, b] = m.map(Number);
		return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	}

	const readoutInk = $derived(luminance(landFill) > 0.52 ? '#10182b' : '#f4f8ff');

	const readoutHalo = $derived(
		luminance(landFill) > 0.52 ? 'rgba(255, 255, 255, 0.55)' : 'rgba(5, 7, 14, 0.85)'
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
				<div class="grabber" aria-hidden="true"></div>
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
					<defs>
						<!-- Sphere shading overlay: bright highlight top-left fading to a dark
						     lower-right edge. objectBoundingBox units, so one gradient gives
						     every marker a 3D ball look regardless of position or size. -->
						<radialGradient id="sphere" cx="0.34" cy="0.28" r="0.85">
							<stop offset="0" stop-color="#ffffff" stop-opacity="0.55" />
							<stop offset="0.22" stop-color="#ffffff" stop-opacity="0.06" />
							<stop offset="0.68" stop-color="#000000" stop-opacity="0" />
							<stop offset="1" stop-color="#000000" stop-opacity="0.3" />
						</radialGradient>
						<!-- Soft contact shadow so markers read as balls seated in the surface. -->
						<filter id="ballShadow" x="-60%" y="-60%" width="220%" height="220%">
							<feDropShadow dx="0" dy="1.1" stdDeviation="1.3" flood-color="#05070e" flood-opacity="0.6" />
						</filter>
					</defs>
					<path d={grat} class="grat" />
					<path d={shape} class="land" style="fill:{landFill}" />
					{#if metricMeta && metricValue != null && centroid}
						<g class="shade-readout">
							<text
								x={centroid[0]}
								y={centroid[1]}
								class="sr-val"
								style="fill:{readoutInk}; stroke:{readoutHalo}"
								>{metricMeta.format(metricValue)}{metricMeta.unit
									? ` ${metricMeta.unit}`
									: ''}</text
							>
							<text
								x={centroid[0]}
								y={centroid[1] + 18}
								class="sr-lab"
								style="fill:{readoutInk}; stroke:{readoutHalo}">{metricMeta.label}</text
							>
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
					{#snippet markerBall(m: Mark, x: number, y: number)}
						{@const r = openId === m.z.id ? 7.5 : 5.5}
						<g
							class="mark"
							class:active={openId === m.z.id}
							class:dim={openId !== null && openId !== m.z.id}
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
						>
							<circle class="ball" cx={x} cy={y} {r} fill={m.color} />
							<circle class="sheen" cx={x} cy={y} {r} fill="url(#sphere)" />
							{#if openId === m.z.id}
								{@const h = r + 5}
								{@const c = 4.5}
								<g class="reticle">
									<path d="M{x - h},{y - h + c} L{x - h},{y - h} L{x - h + c},{y - h}" />
									<path d="M{x + h - c},{y - h} L{x + h},{y - h} L{x + h},{y - h + c}" />
									<path d="M{x + h},{y + h - c} L{x + h},{y + h} L{x + h - c},{y + h}" />
									<path d="M{x - h + c},{y + h} L{x - h},{y + h} L{x - h},{y + h - c}" />
								</g>
							{/if}
							{#if openId === m.z.id}
								<text class="mark-name" x={x + r + 6} y={y + 3.5}>{m.z.name}</text>
							{/if}
						</g>
					{/snippet}

					{#each clusters as cl (cl.id)}
						{#if cl.items.length === 1}
							{@render markerBall(cl.items[0], cl.items[0].x, cl.items[0].y)}
						{:else}
							{@const open = hoveredCluster === cl.id || cl.items.some((i) => i.z.id === openId)}
							<g
								class="cluster"
								role="group"
								aria-label="{cl.items.length} exposures here"
								onpointerenter={() => (hoveredCluster = cl.id)}
								onpointerleave={() => (hoveredCluster = null)}
							>
								<circle class="cluster-hit" cx={cl.cx} cy={cl.cy} r={fanRadius(cl.items.length) + 12} />
								{#if open}
									{@const fan = fanned(cl)}
									{#each fan as f (f.m.z.id)}
										<line class="leader" x1={cl.cx} y1={cl.cy} x2={f.x} y2={f.y} />
									{/each}
									{#each fan as f (f.m.z.id)}
										{@render markerBall(f.m, f.x, f.y)}
									{/each}
								{:else}
									{#each cl.items as m (m.z.id)}
										{@render markerBall(m, m.x, m.y)}
									{/each}
									<circle class="cl-badge-bg" cx={cl.cx + 6.5} cy={cl.cy - 6.5} r="6.5" />
									<text class="cl-badge" x={cl.cx + 6.5} y={cl.cy - 4}>{cl.items.length}</text>
								{/if}
							</g>
						{/if}
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
						{#if z.emissionType}<span class="tag muted">{EMISSION_LABEL[z.emissionType]}</span>{/if}
						{#if z.approx}<span class="tag muted">approximate location</span>{/if}
					</div>
					<p class="desc">{z.desc}</p>
					{#if z.health ?? HEALTH[z.id]}
						<p class="health"><b>Health.</b> {z.health ?? HEALTH[z.id]}</p>
					{/if}
					<div class="sr">
						severity {dots(severityOf(z))} {severityOf(z)}/5 · researched {dots(researchOf(z))}
						{researchOf(z)}/5
					</div>
					{#if z.citations?.length}
						<div class="cites">
							{#each z.citations as c (c.url)}
								<a href={c.url} target="_blank" rel="noopener noreferrer">
									<Icon name="link" size={11} /> {c.ref}{c.openAccess ? ' (open)' : ''}
								</a>
							{/each}
						</div>
					{/if}
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
		backdrop-filter: var(--glass-filter);
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
		backdrop-filter: var(--glass-filter);
		scrollbar-width: thin;
	}
	.grabber {
		display: none;
	}
	.group {
		display: block;
	}
	.group + .group {
		margin-top: 16px;
		padding-top: 16px;
		border-top: 1px solid var(--divider);
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
			rgb(191, 151, 92),
			rgb(151, 143, 118),
			rgb(96, 120, 158),
			rgb(58, 86, 132)
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
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.08);
		border-radius: 999px;
		padding: 4px 11px;
		cursor: pointer;
		transition:
			background 120ms ease,
			opacity 120ms ease;
	}
	.tier.off {
		color: var(--muted);
		background: transparent;
		border-color: var(--line);
		opacity: 0.55;
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
			opacity 180ms ease,
			filter 120ms ease;
	}
	.mark:focus,
	.mark:focus-visible {
		outline: none;
	}
	.mark:hover {
		filter: brightness(1.14);
	}
	.mark.dim {
		opacity: 0.28;
	}
	.ball {
		filter: url(#ballShadow);
	}
	.sheen {
		pointer-events: none;
	}
	.reticle {
		pointer-events: none;
	}
	.reticle path {
		fill: none;
		stroke: rgba(233, 238, 247, 0.9);
		stroke-width: 1;
		stroke-linecap: square;
		animation: reticle-in 160ms ease-out both;
	}
	@keyframes reticle-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	.mark-name {
		font-size: 10.5px;
		font-weight: 600;
		fill: var(--gold);
		paint-order: stroke;
		stroke: #05070e;
		stroke-width: 2.6px;
		stroke-linejoin: round;
		pointer-events: none;
	}
	/* The selected ball flickers (gently scales) in place while its reticle frame
	   holds still. transform-box: fill-box scales about the ball's own center. */
	.mark.active .ball,
	.mark.active .sheen {
		transform-box: fill-box;
		transform-origin: center;
		animation: flicker 1.5s ease-in-out infinite;
	}
	@keyframes flicker {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.16);
		}
	}
	.cluster-hit {
		fill: transparent;
		pointer-events: all;
	}
	.leader {
		stroke: rgba(233, 238, 247, 0.35);
		stroke-width: 0.75;
		pointer-events: none;
	}
	.cl-badge-bg {
		fill: #0b1320;
		stroke: rgba(233, 238, 247, 0.28);
		stroke-width: 0.75;
		pointer-events: none;
	}
	.cl-badge {
		text-anchor: middle;
		font-size: 8.5px;
		font-weight: 700;
		fill: #e9eef7;
		pointer-events: none;
		font-variant-numeric: tabular-nums;
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
			overflow-y: auto;
			overflow-x: hidden;
		}
		/* Mobile bottom-sheet: keep the map full-size (markers intact) and let the
		   unified controls + exposures sheet peek up and reveal on scroll. */
		.grid {
			grid-template-columns: minmax(0, 1fr);
			grid-template-rows: none;
			flex: none;
			gap: 0;
		}
		.mapcol {
			order: -1;
			min-height: 0;
			padding: 10px 0 6px;
		}
		.mapcol svg {
			height: auto;
		}
		.controls {
			grid-row: auto;
			order: 0;
			border-radius: 20px 20px 0 0;
			padding: 6px 18px 18px;
			font-size: 14.5px;
			box-shadow:
				0 -18px 38px -10px rgba(0, 0, 0, 0.6),
				var(--shadow);
		}
		.side {
			order: 1;
			max-height: none;
			border-radius: 0 0 20px 20px;
			margin-top: -1px;
			padding: 14px 18px 22px;
			font-size: 14.5px;
		}
		.grabber {
			display: block;
			width: 40px;
			height: 4px;
			margin: 8px auto 12px;
			border-radius: 999px;
			background: var(--line-strong);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.grid {
			animation: none;
		}
	}
</style>

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
	import { geoGraticule10, geoMercator, geoPath, geoCircle, geoContains } from 'd3-geo';

	const W = 960;
	const H = 620;

	const info = $derived(countryByIso3(page.params.id ?? ''));

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
	// Per-category visibility for the two tiers that split into sub-categories,
	// mirroring the globe's legend so the same fine-grained filters work here.
	const establishedCats = CATEGORIES.filter((c) => c.tier === 'established');
	let catOn = $state<Record<string, boolean>>(
		Object.fromEntries([...establishedCats, ...ANTHRO_SUBCATS].map((c) => [c.key, true]))
	);
	let showReach = $state(false);
	let showAir = $state(false);
	let metric = $state<string>('none');

	// Live AQI is a global fetch shared with the globe; pull it on first enable.
	$effect(() => {
		if (showAir) ensureAirData();
	});
	const metricOptions = [
		{ value: 'none', label: 'No shading' },
		...METRICS.map((m) => ({ value: m.key, label: m.label }))
	];

	const projection = $derived.by(() => {
		if (!info) return null;
		return geoMercator().fitExtent(
			[
				[44, 44],
				[W - 44, H - 44]
			],
			info.feature
		);
	});
	const path = $derived(projection ? geoPath(projection) : null);
	const shape = $derived(path && info ? (path(info.feature) ?? '') : '');
	const grat = $derived(path ? (path(geoGraticule10()) ?? '') : '');

	function zoneVisible(z: Zone): boolean {
		if (!tierOn[z.tier]) return false;
		if (z.tier === 'established' && !catOn[z.category]) return false;
		if (z.tier === 'anthropogenic' && !catOn[anthroSubOf(z)]) return false;
		return true;
	}
	const visibleZones = $derived(info ? info.zones.filter(zoneVisible) : []);

	const marks = $derived.by(() => {
		const proj = projection;
		if (!proj) return [];
		return visibleZones.flatMap((z) => {
			const p = proj([z.lng, z.lat]);
			return p ? [{ z, x: p[0], y: p[1], color: categoryColor(z) }] : [];
		});
	});

	// Reach areas as true projected circles (geoCircle handles map distortion),
	// drawn under the dots when toggled on.
	const reachPaths = $derived.by(() => {
		const p = path;
		if (!p || !showReach) return [];
		return visibleZones.flatMap((z) => {
			const d = p(geoCircle().center([z.lng, z.lat]).radius(zoneRadiusDeg(z))());
			return d ? [{ id: z.id, d, color: categoryColor(z) }] : [];
		});
	});

	// The most prominent cities inside the country, labeled for orientation.
	const cityMarks = $derived.by(() => {
		const proj = projection;
		if (!info || !proj) return [];
		const inside = cities
			.map((c, i) => ({ c, i }))
			.filter(({ c }) => geoContains(info.feature, [c.lng, c.lat]))
			.sort(
				(a, b) =>
					(b.c.significant ? 1e9 : 0) + (b.c.capital ? 5e8 : 0) + b.c.pop -
					((a.c.significant ? 1e9 : 0) + (a.c.capital ? 5e8 : 0) + a.c.pop)
			)
			.slice(0, 10);
		return inside.flatMap(({ c, i }) => {
			const p = proj([c.lng, c.lat]);
			return p ? [{ name: c.name, x: p[0], y: p[1], capital: !!c.capital, idx: i }] : [];
		});
	});

	const metricMeta = $derived(metric !== 'none' ? (METRIC_BY_KEY[metric] ?? null) : null);
	const metricValue = $derived(info && metricMeta ? metricMeta.map[info.iso3] : undefined);
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
	<a class="back" href={resolve('/')}><Icon name="globe" size={14} /> Globe</a>

	{#if !info}
		<div class="empty">
			<h1>Country not found</h1>
			<p>No mapped data for this country code.</p>
		</div>
	{:else}
		<header class="head">
			<h1>{info.name}</h1>
			<span class="count"
				>{info.zones.length} mapped exposure{info.zones.length === 1 ? '' : 's'}</span
			>
		</header>

		<div class="layout">
			<div class="mapcol">
				<div class="mapwrap" style="aspect-ratio: {W} / {H};">
					<svg
						viewBox="0 0 {W} {H}"
						preserveAspectRatio="xMidYMid meet"
						onclick={() => (openId = null)}
						role="presentation"
					>
						<path d={grat} class="grat" />
						<path d={shape} class="land" style="fill:{landFill}" />
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
									<text class="aqi" x={c.x + 5} y={c.y + 14} style="fill:{aqiColor(v)}"
										>{Math.round(v)}</text
									>
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
				</div>
			</div>

			<aside class="rail">
				<div class="controls">
					<div class="switches">
						<label class="switch">
							<input type="checkbox" bind:checked={showReach} />
							<span>Reach areas</span>
						</label>
						<label class="switch">
							<input type="checkbox" bind:checked={showAir} />
							<span>Air quality{showAir && air.status === 'loading' ? ' (loading)' : ''}</span>
						</label>
					</div>
					<div class="ctl">
						<span class="ctl-label">Country shading</span>
						<Select id="metric" label="Country shading" bind:value={metric} options={metricOptions} />
						{#if metricMeta && metricValue != null}
							<div class="metricval">{metricMeta.format(metricValue)} · {metricMeta.label}</div>
						{/if}
					</div>
					<div class="ctl">
						<span class="ctl-label">Layers</span>
						<div class="layers">
							{#each TIERS as t (t.key)}
								<button
									class="chip"
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
					</div>
				</div>

				{#if selected}
					{@const z = selected.z}
					{@const st = statusOf(z)}
					<div class="detail">
						<button class="rail-back" onclick={() => (openId = null)}>
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
						<div class="sr">
							severity {dots(severityOf(z))} · researched {dots(researchOf(z))}
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
						<a class="full" href={resolve('/zone/[id]', { id: z.id })}>
							<Icon name="plus" size={12} /> Open full entry
						</a>
					</div>
				{:else}
					<div class="list-label">
						{marks.length} shown{visibleZones.length !== info.zones.length
							? ` of ${info.zones.length}`
							: ''}
					</div>
					{#if marks.length === 0}
						<p class="none">No exposures match the current tiers.</p>
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
		overflow: auto;
		background: radial-gradient(130% 115% at 50% 26%, #0c1526 0%, #05070e 80%);
		padding: 18px clamp(14px, 4vw, 48px) 40px;
		color: var(--text);
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
	.head {
		display: flex;
		align-items: baseline;
		gap: 14px;
		margin: 18px 2px 4px;
	}
	.head h1 {
		font-family: var(--font-display);
		font-size: clamp(24px, 4vw, 38px);
		margin: 0;
		letter-spacing: -0.01em;
	}
	.count {
		font-size: 13px;
		color: var(--muted);
	}
	.empty {
		text-align: center;
		margin-top: 18vh;
		color: var(--muted);
	}

	/* Map left, controls + detail rail right. The rail fills the width that the
	   centered map used to waste. Entrance scales/fades in so arriving from the
	   globe zoom reads as one continuous move. */
	.layout {
		display: flex;
		align-items: flex-start;
		gap: clamp(16px, 2.5vw, 32px);
		margin-top: 14px;
		animation: arrive 420ms cubic-bezier(0.2, 0.7, 0.2, 1) both;
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
	.mapcol {
		flex: 1;
		min-width: 0;
	}
	.mapwrap {
		position: relative;
		width: 100%;
		max-width: 1100px;
		margin: 0 auto;
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
		transition: fill 200ms ease;
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
		fill: rgba(220, 230, 245, 0.6);
		paint-order: stroke;
		stroke: #05070e;
		stroke-width: 2.4px;
		stroke-linejoin: round;
	}
	.city text.cap {
		fill: #d9b46a;
		font-weight: 600;
	}
	.city text.aqi {
		font-size: 9px;
		font-weight: 700;
		stroke-width: 2.4px;
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

	.rail {
		flex: none;
		width: 340px;
		max-width: 100%;
	}
	.controls {
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 12px;
		padding: 13px 14px;
		backdrop-filter: blur(var(--blur));
		display: flex;
		flex-direction: column;
		gap: 13px;
	}
	.switch {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		font-weight: 600;
		cursor: pointer;
	}
	.switch input {
		width: 15px;
		height: 15px;
		accent-color: var(--accent);
	}
	.ctl-label {
		display: block;
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin-bottom: 7px;
	}
	.metricval {
		margin-top: 7px;
		font-size: 11px;
		color: var(--muted);
	}
	.switches {
		display: flex;
		flex-direction: column;
		gap: 9px;
	}
	.layers {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 6px;
	}
	.subchips {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin: 0 0 3px 10px;
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
		opacity: 0.55;
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
	.chip {
		font-size: 11px;
		font-weight: 600;
		color: var(--text);
		background: var(--accent-soft);
		border: 1px solid var(--accent);
		border-radius: 999px;
		padding: 4px 10px;
		cursor: pointer;
		transition:
			opacity 120ms ease,
			background 120ms ease;
	}
	.chip.off {
		color: var(--muted);
		background: transparent;
		border-color: var(--line);
	}

	.list-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 16px 2px 8px;
	}
	.none {
		color: var(--muted);
		font-size: 13px;
		margin: 8px 2px;
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
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 9px;
		padding: 8px 10px;
		cursor: pointer;
	}
	.list button:hover {
		border-color: var(--line-strong);
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
	}
	.lname {
		flex: 1;
	}
	.ltier {
		color: var(--muted);
		font-size: 10px;
		text-transform: uppercase;
	}

	.detail {
		margin-top: 14px;
		background: var(--panel);
		border: 1px solid var(--line-strong);
		border-radius: 12px;
		padding: 13px 14px;
		backdrop-filter: blur(var(--blur));
	}
	.rail-back {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 11px;
		font-weight: 600;
		color: var(--muted);
		background: none;
		border: none;
		padding: 0 0 9px;
		cursor: pointer;
	}
	.rail-back:hover {
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
		margin: 10px 0 0;
		font-size: 12.5px;
		line-height: 1.5;
		color: #d7e0ee;
	}
	.health {
		margin: 8px 0 0;
		font-size: 12.5px;
		line-height: 1.5;
		color: var(--muted);
	}
	.sr {
		margin-top: 9px;
		font-size: 11px;
		letter-spacing: 0.4px;
		color: #a9b6c9;
	}
	.cites {
		margin-top: 9px;
		display: flex;
		flex-direction: column;
		gap: 4px;
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
		margin-top: 12px;
		font-size: 12px;
		font-weight: 600;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid var(--accent);
		border-radius: 8px;
		padding: 6px 11px;
		text-decoration: none;
	}

	@media (max-width: 900px) {
		.layout {
			flex-direction: column;
		}
		.rail {
			width: 100%;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.layout {
			animation: none;
		}
	}
</style>

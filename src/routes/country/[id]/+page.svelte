<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { categoryColor, CERTAINTY_LABEL } from '$lib/data/scales/categories';
	import { countryByIso3 } from '$lib/data/places/countries';
	import { dots, researchOf, severityOf } from '$lib/data/scales/severity';
	import { statusOf } from '$lib/data/scales/status';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { geoGraticule10, geoMercator, geoPath } from 'd3-geo';

	const W = 960;
	const H = 620;

	const info = $derived(countryByIso3(page.params.id ?? ''));

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

	const marks = $derived.by(() => {
		const proj = projection;
		if (!info || !proj) return [];
		return info.zones.flatMap((z) => {
			const p = proj([z.lng, z.lat]);
			return p ? [{ z, x: p[0], y: p[1], color: categoryColor(z) }] : [];
		});
	});

	let openId = $state<string | null>(null);
	let expanded = $state(false);

	function selectZone(id: string) {
		if (openId === id) {
			expanded = !expanded;
		} else {
			openId = id;
			expanded = false;
		}
	}
	function closeCard() {
		openId = null;
		expanded = false;
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
			<span class="count">{info.zones.length} mapped exposure{info.zones.length === 1 ? '' : 's'}</span>
		</header>

		{#if info.zones.length === 0}
			<p class="none">No ambient-exposure zones are mapped inside this country yet.</p>
		{/if}

		<div class="mapwrap" style="aspect-ratio: {W} / {H};">
			<svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid meet" onclick={closeCard} role="presentation">
				<path d={grat} class="grat" />
				<path d={shape} class="land" />
				{#each marks as m (m.z.id)}
					<g class="mark" class:active={openId === m.z.id}>
						<circle
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
					</g>
				{/each}
			</svg>

			{#each marks as m (m.z.id)}
				{#if openId === m.z.id}
					{@const st = statusOf(m.z)}
					{@const right = m.x > W * 0.62}
					<div
						class="card"
						class:left={right}
						style="left: {(m.x / W) * 100}%; top: {(m.y / H) * 100}%;"
					>
						<div class="card-head">
							<span class="cdot" style="background:{m.color}"></span>
							<span class="cname">{m.z.name}</span>
							<button class="x" onclick={closeCard} aria-label="Close">
								<Icon name="close" size={13} />
							</button>
						</div>
						<div class="tags">
							<span class="tag" style="color:{st.color}; border-color:{st.color}">{st.label}</span>
							<span class="tag muted">{m.z.category}</span>
							{#if m.z.certainty}<span class="tag muted">{CERTAINTY_LABEL[m.z.certainty]}</span>{/if}
						</div>
						{#if !expanded}
							<button class="more" onclick={() => (expanded = true)}>
								<Icon name="plus" size={13} /> Details
							</button>
						{:else}
							<p class="desc">{m.z.desc}</p>
							<p class="health"><b>Health.</b> {m.z.health}</p>
							<div class="sr">
								severity {dots(severityOf(m.z))} · researched {dots(researchOf(m.z))}
							</div>
							{#if m.z.citations?.length}
								<div class="cites">
									{#each m.z.citations as c (c.url)}
										<a href={c.url} target="_blank" rel="noopener noreferrer">
											<Icon name="link" size={11} /> {c.ref}{c.openAccess ? ' (open)' : ''}
										</a>
									{/each}
								</div>
							{/if}
						{/if}
					</div>
				{/if}
			{/each}
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
	.none {
		color: var(--muted);
		margin: 8px 2px;
	}
	.empty {
		text-align: center;
		margin-top: 18vh;
		color: var(--muted);
	}
	.mapwrap {
		position: relative;
		width: min(960px, 94vw);
		margin: 14px auto 0;
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
		fill: #16273f;
		stroke: rgba(140, 175, 220, 0.4);
		stroke-width: 1;
	}
	.mark circle {
		cursor: pointer;
		transition:
			r 120ms ease,
			filter 120ms ease;
	}
	.mark:hover circle {
		filter: brightness(1.25);
	}
	.card {
		position: absolute;
		z-index: 5;
		width: 248px;
		transform: translate(14px, -50%);
		background: var(--panel);
		border: 1px solid var(--line-strong);
		border-radius: 12px;
		padding: 11px 12px;
		box-shadow: var(--shadow);
		backdrop-filter: blur(var(--blur));
	}
	.card.left {
		transform: translate(calc(-100% - 14px), -50%);
	}
	.card-head {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.cdot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
	}
	.cname {
		font-weight: 700;
		font-size: 13px;
		line-height: 1.25;
		flex: 1;
	}
	.x {
		flex: none;
		display: inline-flex;
		color: var(--muted);
		background: none;
		border: none;
		cursor: pointer;
		padding: 2px;
	}
	.x:hover {
		color: var(--text);
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin: 8px 0 2px;
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
	.more {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		margin-top: 9px;
		font-size: 12px;
		font-weight: 600;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid var(--accent);
		border-radius: 8px;
		padding: 5px 10px;
		cursor: pointer;
	}
	.desc {
		margin: 9px 0 0;
		font-size: 12px;
		line-height: 1.5;
		color: #d7e0ee;
	}
	.health {
		margin: 7px 0 0;
		font-size: 12px;
		line-height: 1.5;
		color: var(--muted);
	}
	.sr {
		margin-top: 8px;
		font-size: 11px;
		letter-spacing: 0.4px;
		color: #a9b6c9;
	}
	.cites {
		margin-top: 8px;
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
</style>

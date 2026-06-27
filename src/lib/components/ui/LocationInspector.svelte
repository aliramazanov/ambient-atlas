<script lang="ts">
	import { fly } from 'svelte/transition';
	import { resolve } from '$app/paths';
	import { ui } from '$lib/state/state.svelte';
	import { inspectLocation } from '$lib/interaction/inspect';
	import { CATEGORIES } from '$lib/data/scales/categories';
	import Icon from './Icon.svelte';

	const colorOf = (cat: string) => CATEGORIES.find((c) => c.key === cat)?.color ?? '#999';
	const result = $derived(ui.probe ? inspectLocation(ui.probe.lat, ui.probe.lng) : null);
</script>

{#if ui.probe && result}
	<div class="inspector" transition:fly={{ y: 16, duration: 160 }}>
		<button class="close icon-btn" onclick={() => (ui.probe = null)} aria-label="Close">
			<Icon name="close" size={15} />
		</button>
		<div class="head"><Icon name="pin" size={15} /> Location</div>
		<div class="coords">{ui.probe.lat.toFixed(2)}, {ui.probe.lng.toFixed(2)}</div>

		<div class="section-label">Mapped exposures</div>
		{#if result.zones.length}
			<ul class="zones">
				{#each result.zones as z (z.name + z.tier)}
					<li>
						<span class="dot" style="background:{colorOf(z.category)}"></span>
						<span class="zname">{z.name}</span>
						<span class="meta">{z.tier}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<div class="clear">Clear of every mapped zone here.</div>
		{/if}

		<div class="section-label">Nearest cities</div>
		<div class="cities">
			{#each result.cities as c (c.name)}
				<span class="chip">{c.name} <i>{c.distKm} km</i></span>
			{/each}
		</div>

		{#if result.country}
			<div class="section-label">{result.country.name} (national)</div>
			<div class="metrics">
				{#each result.country.metrics as m (m.label)}
					<div class="m"><span>{m.label}</span><b>{m.value}{m.unit ? ` ${m.unit}` : ''}</b></div>
				{/each}
			</div>
			<a class="country-link" href={resolve('/country/[id]', { id: result.country.iso3 })}>
				<Icon name="globe" size={13} /> Explore {result.country.name}
				<span class="cl-arrow"><Icon name="chevron" size={13} /></span>
			</a>
		{/if}
	</div>
{/if}

<style>
	.inspector {
		position: absolute;
		left: 16px;
		bottom: 64px;
		z-index: 30;
		/* Proportioned to the top search bar (380px) for visual harmony, and sitting
		   above the color-key panel in the bottom-left corner. */
		width: min(380px, calc(100vw - 32px));
		max-height: 62vh;
		overflow-y: auto;
		padding: 14px 16px;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		backdrop-filter: blur(8px);
		font-size: 12px;
	}
	.close {
		position: absolute;
		top: 10px;
		right: 10px;
		width: 26px;
		height: 26px;
	}
	.head {
		font-weight: 700;
		font-size: 13px;
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.head :global(svg) {
		color: var(--accent);
	}
	.coords {
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		margin-bottom: 8px;
	}
	.section-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin: 10px 0 5px;
	}
	.zones {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.zones li {
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
	}
	.zname {
		flex: 1;
	}
	.meta {
		color: var(--muted);
		font-size: 10px;
		text-transform: uppercase;
	}
	.clear {
		color: #6fd99a;
		font-size: 12px;
	}
	.cities {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	.chip {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--line);
		border-radius: 6px;
		padding: 2px 7px;
		font-size: 11px;
	}
	.chip i {
		color: var(--muted);
		font-style: normal;
	}
	.metrics {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.m {
		display: flex;
		justify-content: space-between;
		gap: 10px;
	}
	.m span {
		color: var(--muted);
	}
	.country-link {
		display: flex;
		align-items: center;
		gap: 7px;
		margin-top: 11px;
		padding: 8px 11px;
		font-size: 12px;
		font-weight: 600;
		text-decoration: none;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid var(--accent);
		border-radius: 8px;
	}
	.country-link .cl-arrow {
		margin-left: auto;
		display: inline-flex;
	}
	.country-link:hover {
		background: color-mix(in srgb, var(--accent) 24%, transparent);
	}
</style>

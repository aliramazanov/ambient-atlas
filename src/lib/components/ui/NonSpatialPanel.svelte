<script lang="ts">
	import { METRICS, METRIC_BY_KEY } from '$lib/data/places/metrics';
	import { questions } from '$lib/data/zones/questions';
	import { air } from '$lib/state/air-quality.svelte';
	import { flyToLocation, ui } from '$lib/state/state.svelte';
	import { cubicOut } from 'svelte/easing';
	import { scale, slide } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import Select from './Select.svelte';

	let minimized = $state(typeof window !== 'undefined' && window.innerWidth < 880);

	const pinCount = $derived(Object.keys(ui.pinned).length);

	const metricOptions = [
		{ value: 'none', label: 'None' },
		...METRICS.map((m) => ({ value: m.key, label: m.label }))
	];

	function resetView() {
		ui.probe = null;
		flyToLocation(20, 10, 3.2);
	}
</script>

{#if minimized}
	<button
		class="launcher"
		onclick={() => (minimized = false)}
		aria-label="Show controls"
		transition:scale={{ duration: 240, start: 0.85, opacity: 0, easing: cubicOut }}
	>
		<Icon name="info" size={15} />
	</button>
{:else}
	<div class="wrap" transition:scale={{ duration: 260, start: 0.93, opacity: 0, easing: cubicOut }}>
		<div class="lhead">
			<span class="ltitle">Controls</span>
			<button class="min" onclick={() => (minimized = true)} aria-label="Hide controls">
				<Icon name="minus" size={14} />
			</button>
		</div>
		<button class="toggle" onclick={() => (ui.showQuestions = !ui.showQuestions)}>
			<span class="tlabel"><Icon name="info" size={14} /> Non-spatial open questions</span>
			<span class="chev" class:open={ui.showQuestions}><Icon name="chevron" size={14} /></span>
		</button>

	{#if ui.showQuestions}
		<div class="panel" transition:slide={{ duration: 180 }}>
			<p class="lead">
				Real ambient exposures that are global or diffuse, with no honest single location.
			</p>
			{#each questions as q (q.id)}
				<div class="item">
					<div class="q-name">{q.name}</div>
					<div class="q-desc">{q.desc}</div>
					{#if q.citations.length}
						<div class="cites">
							{#each q.citations as c (c.url)}
								<a href={c.url} target="_blank" rel="noopener noreferrer">
									{c.ref}{c.openAccess ? ' (open)' : ''}
								</a>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}

	<button
		class="reach"
		class:on={ui.showAllAreas}
		onclick={() => (ui.showAllAreas = !ui.showAllAreas)}
		aria-pressed={ui.showAllAreas}
	>
		<span class="tlabel"><Icon name="layers" size={14} /> Show all reach areas</span>
		<span class="pill">{ui.showAllAreas ? 'ON' : 'OFF'}</span>
	</button>

	<button
		class="reach"
		class:on={ui.layers.airQuality}
		onclick={() => (ui.layers.airQuality = !ui.layers.airQuality)}
		aria-pressed={ui.layers.airQuality}
	>
		<span class="tlabel"><Icon name="wind" size={14} /> Air quality (live)</span>
		<span class="pill">
			{ui.layers.airQuality ? (air.status === 'loading' ? '···' : 'ON') : 'OFF'}
		</span>
	</button>

	<div class="viewbar">
		<button class="vbtn" onclick={resetView}>
			<Icon name="globe" size={13} /> Reset view
		</button>
		{#if pinCount > 0}
			<button class="vbtn" onclick={() => (ui.pinned = {})}>
				<Icon name="close" size={13} /> Clear pins ({pinCount})
			</button>
		{/if}
	</div>

	<div class="metricbox">
		<span class="mlabel">Country metric</span>
		<Select id="metric" label="Country metric" bind:value={ui.countryMetric} options={metricOptions} />
		{#if ui.countryMetric !== 'none'}
			{@const m = METRIC_BY_KEY[ui.countryMetric]}
			<div class="mdesc">
				{m.source}{m.year ? `, ${m.year}` : ''}.
				{m.higherBetter ? 'Higher is better.' : 'Lower is better.'}
			</div>
		{/if}
	</div>
	</div>
{/if}

<style>
	.wrap {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 20;
		width: 320px;
		max-width: calc(100% - 32px);
		transform-origin: 0 0;
	}
	.launcher {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 20;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		color: var(--text);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		cursor: pointer;
		backdrop-filter: blur(8px);
		transform-origin: 0 0;
	}
	.lhead {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
		padding: 5px 7px 5px 12px;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		backdrop-filter: blur(8px);
	}
	.ltitle {
		font-family: var(--font-mono);
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.min {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		color: var(--muted);
		background: transparent;
		border: none;
		border-radius: 7px;
		cursor: pointer;
		transition:
			color var(--dur) var(--ease),
			background var(--dur) var(--ease);
	}
	.min:hover {
		color: var(--text);
		background: var(--line);
	}
	.toggle {
		width: 100%;
		text-align: left;
		font-size: 12px;
		font-weight: 600;
		color: var(--text);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 10px 12px;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		backdrop-filter: blur(8px);
	}
	.tlabel {
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.chev {
		display: flex;
		transition: transform var(--dur) var(--ease);
	}
	.reach {
		width: 100%;
		margin-top: 8px;
		text-align: left;
		font-size: 12px;
		font-weight: 600;
		color: var(--text);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 10px 12px;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		backdrop-filter: blur(8px);
		transition:
			border-color var(--dur) var(--ease),
			background var(--dur) var(--ease);
	}
	.reach.on {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.pill {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 2px 7px;
		border-radius: 999px;
		border: 1px solid var(--line-strong);
		color: var(--muted);
	}
	.reach.on .pill {
		color: var(--accent);
		border-color: var(--accent);
	}
	.viewbar {
		margin-top: 8px;
		display: flex;
		gap: 8px;
	}
	.vbtn {
		flex: 1;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 11.5px;
		font-weight: 600;
		color: var(--muted);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 8px 10px;
		cursor: pointer;
		backdrop-filter: blur(8px);
		transition:
			color var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.vbtn:hover {
		color: var(--text);
		border-color: var(--line-strong);
	}
	.metricbox {
		margin-top: 8px;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 10px 12px;
		backdrop-filter: blur(8px);
	}
	.mlabel {
		display: block;
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 7px;
	}
	.mdesc {
		margin-top: 8px;
		font-size: 11px;
		line-height: 1.5;
		color: var(--muted);
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.panel {
		margin-top: 8px;
		max-height: min(70vh, 560px);
		overflow-y: auto;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 12px;
		backdrop-filter: blur(8px);
	}
	.lead {
		margin: 0 0 10px;
		font-size: 11px;
		color: var(--muted);
		line-height: 1.5;
	}
	.item {
		padding: 9px 0;
		border-top: 1px solid var(--line);
	}
	.item:first-of-type {
		border-top: none;
	}
	.q-name {
		font-weight: 600;
		font-size: 12.5px;
	}
	.q-desc {
		margin-top: 4px;
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--muted);
	}
	.cites {
		margin-top: 6px;
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.cites a {
		font-size: 11px;
	}
</style>

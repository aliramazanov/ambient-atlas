<script lang="ts">
	import { METRICS, METRIC_BY_KEY } from '$lib/data/places/metrics';
	import { questions } from '$lib/data/zones/questions';
	import { air } from '$lib/state/air-quality.svelte';
	import { useIsMobile } from '$lib/state/media.svelte';
	import { flyToLocation, ui } from '$lib/state/state.svelte';
	import { cubicOut } from 'svelte/easing';
	import { scale, slide } from 'svelte/transition';
	import Badge from './Badge.svelte';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import Scrim from './Scrim.svelte';
	import Select from './Select.svelte';
	import Toggle from './Toggle.svelte';

	const mobile = useIsMobile();
	let minimized = $state(mobile.current);
	$effect(() => {
		minimized = mobile.current;
	});

	function open() {
		minimized = false;
		ui.openPanel = 'controls';
	}
	function close() {
		minimized = true;
		if (ui.openPanel === 'controls') ui.openPanel = null;
	}
	$effect(() => {
		if (mobile.current && ui.openPanel && ui.openPanel !== 'controls') minimized = true;
	});
	const hidden = $derived(mobile.current && ui.openPanel !== null && ui.openPanel !== 'controls');

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

{#if !minimized}
	{#if mobile.current}
		<Scrim onclose={close} label="Close controls" />
	{/if}
	<div class="wrap" transition:scale={{ duration: 260, start: 0.93, opacity: 0, easing: cubicOut }}>
		<div class="lhead">
			<span class="ltitle">Controls</span>
			<Button variant="ghost" size="icon" style="--btn-size:26px" onclick={close} aria-label="Hide controls">
				<Icon name="minus" size={14} />
			</Button>
		</div>

		<Toggle
			label="Non-spatial open questions"
			icon="info"
			onclick={() => (ui.showQuestions = !ui.showQuestions)}
		>
			{#snippet trailing()}
				<span class="chev" class:open={ui.showQuestions}><Icon name="chevron" size={14} /></span>
			{/snippet}
		</Toggle>

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

		<Toggle
			label="Show all reach areas"
			icon="layers"
			active={ui.showAllAreas}
			aria-pressed={ui.showAllAreas}
			onclick={() => (ui.showAllAreas = !ui.showAllAreas)}
		>
			{#snippet trailing()}
				<Badge active={ui.showAllAreas}>{ui.showAllAreas ? 'ON' : 'OFF'}</Badge>
			{/snippet}
		</Toggle>

		<Toggle
			label="Air quality (live)"
			icon="wind"
			active={ui.layers.airQuality}
			aria-pressed={ui.layers.airQuality}
			onclick={() => (ui.layers.airQuality = !ui.layers.airQuality)}
		>
			{#snippet trailing()}
				<Badge active={ui.layers.airQuality}>
					{ui.layers.airQuality ? (air.status === 'loading' ? '···' : 'ON') : 'OFF'}
				</Badge>
			{/snippet}
		</Toggle>

		<div class="viewbar">
			<Button variant="outline" size="sm" onclick={resetView}>
				<Icon name="globe" size={13} /> Reset view
			</Button>
			{#if pinCount > 0}
				<Button variant="outline" size="sm" onclick={() => (ui.pinned = {})}>
					<Icon name="close" size={13} /> Clear pins ({pinCount})
				</Button>
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
{:else if !hidden}
	<Button
		variant="outline"
		size="icon"
		class="ctrl-launcher"
		style="--btn-size:40px"
		onclick={open}
		aria-label="Show controls"
	>
		<Icon name="info" size={15} />
	</Button>
{/if}

<style>
	.wrap {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 20;
		width: 288px;
		max-width: calc(100% - 32px);
		display: flex;
		flex-direction: column;
		gap: 8px;
		transform-origin: 0 0;
	}
	:global(.ctrl-launcher) {
		position: absolute;
		top: 16px;
		left: 16px;
		z-index: 20;
		color: var(--text);
		transform-origin: 0 0;
	}
	.lhead {
		display: flex;
		justify-content: space-between;
		align-items: center;
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
	.chev {
		display: flex;
		transition: transform var(--dur) var(--ease);
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.viewbar {
		display: flex;
		gap: 8px;
	}
	.viewbar :global(.btn) {
		flex: 1;
		color: var(--muted);
	}
	.metricbox {
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
	.panel {
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
	@media (max-width: 1023px) {
		.wrap {
			top: 64px;
			left: 16px;
			right: 16px;
			width: auto;
			max-width: none;
			max-height: calc(100dvh - 80px);
			overflow-y: auto;
		}
	}
</style>

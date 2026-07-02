<script lang="ts">
	import { resolve } from '$app/paths';
	import { ANTHRO_SUBCATS, anthroSubOf, CATEGORIES, TIERS } from '$lib/data/scales/categories';
	import { useIsMobile } from '$lib/state/media.svelte';
	import { ui } from '$lib/state/state.svelte';
	import { zones } from '$lib/data/zones/zones';
	import { cubicOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import Button from './Button.svelte';
	import Icon from './Icon.svelte';
	import Scrim from './Scrim.svelte';

	const established = CATEGORIES.filter((c) => c.tier === 'established');

	const visibleCount = $derived(
		zones.filter(
			(z) =>
				ui.tiers[z.tier] &&
				(z.tier !== 'established' || ui.cats[z.category]) &&
				(z.tier !== 'anthropogenic' || ui.cats[anthroSubOf(z)])
		).length
	);

	const anyFilterOff = $derived(
		Object.values(ui.tiers).some((v) => !v) || Object.values(ui.cats).some((v) => !v)
	);

	const allLayersOn = $derived(
		Object.values(ui.tiers).every((v) => v) && Object.values(ui.cats).every((v) => v)
	);

	function resetFilters() {
		setAllLayers(true);
	}

	function setAllLayers(on: boolean) {
		for (const k of Object.keys(ui.tiers)) ui.tiers[k as keyof typeof ui.tiers] = on;
		for (const k of Object.keys(ui.cats)) ui.cats[k] = on;
	}

	const mobile = useIsMobile();
	let minimized = $state(mobile.current);
	$effect(() => {
		minimized = mobile.current;
	});
	function showLegend() {
		minimized = false;
		ui.openPanel = 'legend';
	}
	function hideLegend() {
		minimized = true;
		if (ui.openPanel === 'legend') ui.openPanel = null;
	}
	$effect(() => {
		if (mobile.current && ui.openPanel && ui.openPanel !== 'legend') minimized = true;
	});
	const hidden = $derived(mobile.current && ui.openPanel !== null && ui.openPanel !== 'legend');
	let open = $state<Record<string, boolean>>({});
	const toggle = (k: string) => (open[k] = !open[k]);
</script>

{#if !minimized}
	{#if mobile.current}
		<Scrim onclose={hideLegend} label="Close menu" />
	{/if}
	<div class="legend glass" transition:scale={{ duration: 260, start: 0.93, opacity: 0, easing: cubicOut }}>
		<div class="header">
			<div class="title">Ambient Atlas</div>
			<Button variant="icon" size="icon" style="--btn-size:26px" onclick={hideLegend} aria-label="Minimize menu">
				<Icon name="minus" size={15} />
			</Button>
		</div>

		<div class="navlinks">
			<a href={resolve('/rankings')}><Icon name="list" size={13} /> Rankings</a>
			<a href={resolve('/about')}><Icon name="info" size={13} /> Sources</a>
		</div>

		<div class="countbar">
			<span>Showing <b>{visibleCount}</b> of {zones.length} zones</span>
			{#if anyFilterOff}
				<button class="reset" onclick={resetFilters}>Reset filters</button>
			{/if}
		</div>

		<div class="scroll">
			<details class="sec" open>
				<summary><span>Layers</span><span class="chev"><Icon name="chevron" size={13} /></span></summary>
				<div class="body">
					<label class="row master">
						<input
							type="checkbox"
							checked={allLayersOn}
							onchange={(e) => setAllLayers(e.currentTarget.checked)}
						/>
						<span>All layers</span>
					</label>
					{#each TIERS as t (t.key)}
						<div class="row">
							<label class="tlabel">
								<input type="checkbox" bind:checked={ui.tiers[t.key]} />
								<span>{t.label}</span>
							</label>
							<button class="plus" onclick={() => toggle('tier:' + t.key)} aria-label="Explain {t.label}">
								{open['tier:' + t.key] ? '×' : '+'}
							</button>
						</div>
						{#if open['tier:' + t.key]}<div class="desc-line">{t.desc}</div>{/if}
						{#if t.key === 'established' && ui.tiers.established}
							<div class="subcats">
								{#each established as c (c.key)}
									<label class="row subcat">
										<input type="checkbox" bind:checked={ui.cats[c.key]} />
										<span class="swatch" style="background:{c.color}"></span>
										<span>{c.label}</span>
									</label>
								{/each}
							</div>
						{/if}
						{#if t.key === 'anthropogenic' && ui.tiers.anthropogenic}
							<div class="subcats">
								{#each ANTHRO_SUBCATS as s (s.key)}
									<label class="row subcat">
										<input type="checkbox" bind:checked={ui.cats[s.key]} />
										<span class="swatch" style="background:{s.color}"></span>
										<span>{s.label}</span>
									</label>
								{/each}
							</div>
						{/if}
					{/each}
				</div>
			</details>
		</div>
	</div>
{:else if !hidden}
	<button class="launcher" onclick={showLegend} aria-label="Open menu" transition:scale={{ duration: 240, start: 0.85, opacity: 0, easing: cubicOut }}>
		<span class="dot"></span>
		<Icon name="layers" size={15} />
	</button>
{/if}

<style>
	.legend {
		position: absolute;
		top: 16px;
		right: 16px;
		z-index: 20;
		width: 288px;
		transform-origin: 100% 0;
		display: flex;
		flex-direction: column;
		max-height: calc(100% - 32px);
		padding: 14px 14px 6px;
		font-size: 12.5px;
	}
	.launcher {
		position: absolute;
		top: 16px;
		right: 16px;
		z-index: 20;
		transform-origin: 100% 0;
		display: inline-flex;
		align-items: center;
		gap: 9px;
		padding: 9px 13px;
		color: var(--text);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 999px;
		box-shadow: var(--shadow);
		backdrop-filter: var(--glass-filter);
		-webkit-backdrop-filter: var(--glass-filter);
		cursor: pointer;
	}
	.dot {
		width: 8px;
		height: 8px;
		border-radius: 2px;
		flex: none;
		background: linear-gradient(135deg, #e6c785, #c79a52);
	}
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.title {
		font-family: var(--font-display);
		font-weight: 700;
		font-size: 15px;
		letter-spacing: -0.01em;
		display: flex;
		align-items: center;
		gap: 9px;
	}
	.navlinks {
		display: flex;
		gap: 14px;
		margin: 8px 0 4px;
		padding-bottom: 6px;
	}
	.navlinks a {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--accent);
		text-decoration: none;
	}
	.navlinks a:hover {
		text-decoration: underline;
	}
	.countbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		margin: 8px 0 2px;
		font-size: 11px;
		color: var(--muted);
	}
	.countbar b {
		color: var(--text);
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
	}
	.reset {
		font-size: 11px;
		color: var(--accent);
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
	}
	.reset:hover {
		text-decoration: underline;
	}
	.scroll {
		overflow-y: auto;
		margin: 0 -4px;
		padding: 0 4px;
	}
	.sec {
		border-top: 1px solid var(--divider);
	}
	.sec > summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		list-style: none;
		padding: 10px 0;
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--muted);
	}
	.sec > summary::-webkit-details-marker {
		display: none;
	}
	.sec > summary:hover {
		color: var(--text);
	}
	.chev {
		display: flex;
		transition: transform var(--dur) var(--ease);
	}
	.sec[open] > summary .chev {
		transform: rotate(90deg);
	}
	.body {
		padding-bottom: 8px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 3px 0;
		border-radius: 6px;
		transition: background var(--dur) var(--ease);
	}
	label.row {
		cursor: pointer;
	}
	.swatch {
		width: 11px;
		height: 11px;
		border-radius: 3px;
		flex: none;
	}
	.tlabel {
		display: flex;
		align-items: center;
		gap: 8px;
		flex: 1;
		cursor: pointer;
	}
	.plus {
		margin-left: auto;
		width: 18px;
		height: 18px;
		line-height: 1;
		padding: 0;
		flex: none;
		border-radius: 50%;
		border: 1px solid var(--line);
		background: rgba(255, 255, 255, 0.05);
		color: var(--muted);
		font-size: 13px;
		cursor: pointer;
	}
	.plus:hover {
		color: var(--text);
		background: rgba(255, 255, 255, 0.12);
	}
	.desc-line {
		font-size: 11px;
		color: var(--muted);
		line-height: 1.5;
		margin: 4px 0 8px 2px;
	}
	.subcats {
		display: flex;
		flex-direction: column;
		gap: 1px;
		margin: 2px 0 6px 14px;
		padding-left: 9px;
		border-left: 1px solid var(--line);
	}
	.subcat {
		font-size: 11.5px;
		color: var(--muted);
	}
	.master {
		font-weight: 600;
		margin-bottom: 4px;
		padding-bottom: 7px;
		border-bottom: 1px solid var(--line);
	}
	input {
		accent-color: #d9b46a;
	}
	@media (max-width: 1023px) {
		.legend {
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

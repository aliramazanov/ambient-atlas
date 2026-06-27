<script lang="ts">
	import { resolve } from '$app/paths';
	import { ANTHRO_SUBCATS, anthroSubOf, CATEGORIES, TIERS } from '$lib/data/scales/categories';
	import { zones } from '$lib/data/zones/zones';
	import { air, AQI_LEGEND, ensureAirData } from '$lib/state/air-quality.svelte';
	import { ui } from '$lib/state/state.svelte';
	import { cubicOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
	import Icon from './Icon.svelte';

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

	let minimized = $state(false);
	let open = $state<Record<string, boolean>>({});
	const toggle = (k: string) => (open[k] = !open[k]);
</script>

{#if minimized}
	<button class="launcher" onclick={() => (minimized = false)} aria-label="Open menu" transition:scale={{ duration: 240, start: 0.85, opacity: 0, easing: cubicOut }}>
		<span class="dot"></span>
		<Icon name="layers" size={15} />
	</button>
{:else}
	<div class="legend" transition:scale={{ duration: 260, start: 0.93, opacity: 0, easing: cubicOut }}>
		<div class="header">
			<div class="title"><span class="dot"></span> Ambient Atlas</div>
			<button class="icon-btn min" onclick={() => (minimized = true)} aria-label="Minimize menu">
				<Icon name="minus" size={15} />
			</button>
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

			<details class="sec" open>
				<summary><span>Data</span><span class="chev"><Icon name="chevron" size={13} /></span></summary>
				<div class="body">
					<label class="row">
						<input type="checkbox" bind:checked={ui.layers.airQuality} />
						<span>Air quality (live)</span>
					</label>
					{#if ui.layers.airQuality}
						{#if air.status === 'loading'}
							<div class="sub"><span class="spinner"></span> loading current AQI</div>
						{:else if air.status === 'error'}
							<div class="sub">
								could not load AQI <button class="retry" onclick={() => ensureAirData()}>retry</button>
							</div>
						{:else if air.status === 'ready'}
							{#each AQI_LEGEND as a (a.label)}
								<div class="row sub">
									<span class="swatch sm" style="background:{a.color}"></span>
									<span>{a.label}</span>
								</div>
							{/each}
						{/if}
					{/if}
				</div>
			</details>
		</div>
	</div>
{/if}

<style>
	.legend {
		position: absolute;
		top: 18px;
		right: 18px;
		z-index: 20;
		width: 256px;
		transform-origin: 100% 0;
		display: flex;
		flex-direction: column;
		max-height: calc(100% - 36px);
		padding: 14px 14px 6px;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		box-shadow: var(--shadow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
		font-size: 12.5px;
	}
	.launcher {
		position: absolute;
		top: 18px;
		right: 18px;
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
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
		cursor: pointer;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
		background: radial-gradient(circle at 30% 30%, #f3dca0, #d9b46a);
		box-shadow: 0 0 10px rgba(217, 180, 106, 0.7);
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
	.min {
		width: 26px;
		height: 26px;
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
	.retry {
		font-size: 11px;
		color: var(--accent);
		background: none;
		border: 1px solid var(--accent);
		border-radius: 6px;
		padding: 1px 7px;
		cursor: pointer;
		margin-left: 4px;
	}
	.scroll {
		overflow-y: auto;
		margin: 0 -4px;
		padding: 0 4px;
	}
	.sec {
		border-top: 1px solid var(--line);
	}
	.sec > summary {
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		list-style: none;
		padding: 10px 0;
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.07em;
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
	.swatch.sm {
		width: 10px;
		height: 10px;
		border-radius: 2px;
	}
	.sub {
		font-size: 11px;
		color: var(--muted);
		line-height: 1.45;
		padding: 2px 0 2px 2px;
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
	@media (max-width: 600px) {
		.legend {
			width: min(256px, calc(100vw - 24px));
			top: 12px;
			right: 12px;
		}
		.launcher {
			top: 12px;
			right: 12px;
		}
	}
</style>

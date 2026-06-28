<script lang="ts">
	import { ANTHRO_SUBCATS, CATEGORIES } from '$lib/data/scales/categories';
	import { slide } from 'svelte/transition';
	import Icon from './Icon.svelte';

	const established = CATEGORIES.filter((c) => c.tier === 'established');
	const tiers = CATEGORIES.filter((c) => c.tier !== 'established');

	const groups = [
		{ title: 'Established categories', items: established },
		{ title: 'Tiers', items: tiers },
		{ title: 'Anthropogenic types', items: ANTHRO_SUBCATS }
	];

	let open = $state(false);
	let openKey = $state<string | null>(null);
	const toggle = (k: string) => (openKey = openKey === k ? null : k);
</script>

<div class="wrap">
	{#if open}
		<div class="panel" transition:slide={{ duration: 160 }}>
			{#each groups as g (g.title)}
				<div class="sub">{g.title}</div>
				{#each g.items as c (c.key)}
					<button
						class="row"
						class:open={openKey === c.key}
						aria-expanded={openKey === c.key}
						onclick={() => toggle(c.key)}
					>
						<span class="swatch" style="background:{c.color}"></span>
						<span class="rlabel">{c.label}</span>
						<span class="chev" class:open={openKey === c.key}><Icon name="chevron" size={12} /></span>
					</button>
					{#if openKey === c.key}
						<div class="rdesc" transition:slide={{ duration: 140 }}>{c.desc}</div>
					{/if}
				{/each}
			{/each}
		</div>
	{/if}

	<button class="toggle" onclick={() => (open = !open)} aria-expanded={open}>
		<span class="tlabel"><Icon name="layers" size={13} /> Color key</span>
		<span class="chev" class:open><Icon name="chevron" size={13} /></span>
	</button>
</div>

<style>
	.wrap {
		position: absolute;
		bottom: 16px;
		left: 16px;
		z-index: 20;
		width: 270px;
		max-width: calc(100% - 32px);
		display: flex;
		flex-direction: column;
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
		padding: 9px 12px;
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
		color: var(--muted);
		transition: transform var(--dur) var(--ease);
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.panel {
		margin-bottom: 8px;
		max-height: min(62vh, 480px);
		overflow-y: auto;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 8px;
		backdrop-filter: blur(8px);
	}
	.sub {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--faint);
		margin: 12px 6px 4px;
	}
	.sub:first-child {
		margin-top: 4px;
	}
	.row {
		width: 100%;
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 8px;
		font-size: 12px;
		color: var(--text);
		background: none;
		border: none;
		border-radius: 7px;
		cursor: pointer;
		text-align: left;
		transition: background var(--dur) var(--ease);
	}
	.row:hover,
	.row.open {
		background: rgba(255, 255, 255, 0.04);
	}
	.swatch {
		width: 11px;
		height: 11px;
		border-radius: 3px;
		flex: none;
	}
	.rlabel {
		flex: 1;
	}
	.rdesc {
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--muted);
		padding: 2px 10px 9px 28px;
	}
</style>

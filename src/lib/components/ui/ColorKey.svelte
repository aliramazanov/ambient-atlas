<script lang="ts">
	import { ANTHRO_SUBCATS, CATEGORIES } from '$lib/data/scales/categories';
	import { slide } from 'svelte/transition';
	import Icon from './Icon.svelte';

	const established = CATEGORIES.filter((c) => c.tier === 'established');
	const tiers = CATEGORIES.filter((c) => c.tier !== 'established');

	let open = $state(false);
	let detail = $state<Record<string, boolean>>({});
	const toggle = (k: string) => (detail[k] = !detail[k]);
</script>

<div class="wrap">
	{#if open}
		<div class="panel" transition:slide={{ duration: 160 }}>
			<div class="sub">Established categories</div>
			<div class="chips">
				{#each established as c (c.key)}
					<button class="chip" class:active={detail['c:' + c.key]} onclick={() => toggle('c:' + c.key)}>
						<span class="swatch" style="background:{c.color}"></span>{c.label}
					</button>
				{/each}
			</div>
			{#each established as c (c.key)}
				{#if detail['c:' + c.key]}<div class="line">{c.label}: {c.desc}</div>{/if}
			{/each}

			<div class="sub">Tiers</div>
			<div class="chips">
				{#each tiers as c (c.key)}
					<button class="chip" class:active={detail['c:' + c.key]} onclick={() => toggle('c:' + c.key)}>
						<span class="swatch" style="background:{c.color}"></span>{c.label}
					</button>
				{/each}
			</div>
			{#each tiers as c (c.key)}
				{#if detail['c:' + c.key]}<div class="line">{c.label}: {c.desc}</div>{/if}
			{/each}

			<div class="sub">Anthropogenic types</div>
			<div class="chips">
				{#each ANTHRO_SUBCATS as s (s.key)}
					<button class="chip" class:active={detail['s:' + s.key]} onclick={() => toggle('s:' + s.key)}>
						<span class="swatch" style="background:{s.color}"></span>{s.label}
					</button>
				{/each}
			</div>
			{#each ANTHRO_SUBCATS as s (s.key)}
				{#if detail['s:' + s.key]}<div class="line">{s.label}: {s.desc}</div>{/if}
			{/each}

			<div class="hint">Tap a chip for what it means.</div>
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
		transition: transform var(--dur) var(--ease);
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.panel {
		margin-bottom: 8px;
		max-height: min(60vh, 460px);
		overflow-y: auto;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 12px;
		backdrop-filter: blur(8px);
	}
	.sub {
		font-size: 10px;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: var(--faint);
		margin: 10px 0 6px;
	}
	.sub:first-child {
		margin-top: 0;
	}
	.chips {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: var(--muted);
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 3px 9px 3px 7px;
		cursor: pointer;
	}
	.chip.active {
		color: var(--text);
		border-color: var(--line-strong);
	}
	.swatch {
		width: 10px;
		height: 10px;
		border-radius: 3px;
		flex: none;
	}
	.line {
		font-size: 11px;
		line-height: 1.45;
		color: var(--muted);
		margin: 4px 0 2px;
	}
	.hint {
		margin-top: 10px;
		font-size: 10px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.32);
	}
</style>

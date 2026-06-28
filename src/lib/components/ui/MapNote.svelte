<script lang="ts">
	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';

	let open = $state(false);
</script>

<div class="mapnote">
	{#if open}
		<div class="note" transition:fly={{ y: 8, duration: 160 }}>
			Zone boundaries are approximate and illustrative. Gray zones mark open questions, not
			established risks. Anthropogenic and conflict layers mix established harm with contested and
			anecdotal reports; absence of a marker is not proof of safety.
		</div>
	{/if}
	<button class="ibtn icon-btn" onclick={() => (open = !open)} aria-label="About this map" aria-expanded={open}>
		<Icon name="info" size={14} />
		<span>About this map</span>
	</button>
</div>

<style>
	.mapnote {
		position: absolute;
		bottom: 16px;
		right: 16px;
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	.note {
		max-width: 560px;
		text-align: center;
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--muted);
		background: var(--panel);
		border: 1px solid var(--line);
		padding: 10px 16px;
		border-radius: var(--radius-sm);
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
		box-shadow: var(--shadow);
	}
	.ibtn {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		padding: 6px 12px;
		font-size: 11px;
		letter-spacing: 0.03em;
		border-radius: 999px;
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
	}
</style>

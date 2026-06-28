<script lang="ts">
	import { ui } from '$lib/state/state.svelte';
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';

	let open = $state(false);
	let isMobile = $state(typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches);
	onMount(() => {
		const mql = window.matchMedia('(max-width: 1023px)');
		const on = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mql.addEventListener('change', on);
		return () => mql.removeEventListener('change', on);
	});
	const hidden = $derived(isMobile && ui.openPanel !== null && ui.openPanel !== 'about');
	$effect(() => {
		if (isMobile && ui.openPanel && ui.openPanel !== 'about') open = false;
	});
	function toggleNote() {
		open = !open;
		if (open) ui.openPanel = 'about';
		else if (ui.openPanel === 'about') ui.openPanel = null;
	}
</script>

{#if isMobile && open}
	<button class="scrim" onclick={toggleNote} aria-label="Close"></button>
{/if}
{#if !hidden}
	<div class="mapnote">
		{#if open}
			<div class="note" transition:fly={{ y: 8, duration: 160 }}>
				Zone boundaries are approximate and illustrative. Gray zones mark open questions, not
				established risks. Anthropogenic and conflict layers mix established harm with contested and
				anecdotal reports; absence of a marker is not proof of safety.
			</div>
		{/if}
		<button class="ibtn icon-btn" onclick={toggleNote} aria-label="About this map" aria-expanded={open}>
			<Icon name="info" size={14} />
			<span>About this map</span>
		</button>
	</div>
{/if}

<style>
	.mapnote {
		position: absolute;
		bottom: 16px;
		right: 16px;
		z-index: 20;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
	}
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 19;
		border: none;
		background: rgba(3, 5, 9, 0.45);
		backdrop-filter: blur(1px);
		cursor: default;
	}
	.note {
		max-width: min(300px, calc(100vw - 32px));
		text-align: left;
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--muted);
		background: var(--panel);
		border: 1px solid var(--line);
		padding: 10px 16px;
		border-radius: var(--radius-sm);
		backdrop-filter: var(--glass-filter);
		-webkit-backdrop-filter: var(--glass-filter);
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
		backdrop-filter: var(--glass-filter);
		-webkit-backdrop-filter: var(--glass-filter);
	}
</style>

<script lang="ts">
	import { useIsMobile } from '$lib/state/media.svelte';
	import { ui } from '$lib/state/state.svelte';
	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';
	import Scrim from './Scrim.svelte';

	let open = $state(false);
	const mobile = useIsMobile();
	const hidden = $derived(mobile.current && ui.openPanel !== null && ui.openPanel !== 'about');
	$effect(() => {
		if (mobile.current && ui.openPanel && ui.openPanel !== 'about') open = false;
	});
	function toggleNote() {
		open = !open;
		if (open) ui.openPanel = 'about';
		else if (ui.openPanel === 'about') ui.openPanel = null;
	}
</script>

{#if mobile.current && open}
	<Scrim onclose={toggleNote} />
{/if}
{#if !hidden}
	<div class="mapnote">
		{#if open}
			<div class="note glass" transition:fly={{ y: 8, duration: 160 }}>
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
	.note {
		max-width: min(300px, calc(100vw - 32px));
		text-align: left;
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--muted);
		padding: 10px 16px;
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

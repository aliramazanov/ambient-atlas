<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import { ui } from '$lib/state/state.svelte';
	import { readUrlState, writeUrlState } from '$lib/state/url-state';
	import { view } from '$lib/state/viewport.svelte';
	import { onMount, type Component } from 'svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const onGlobe = $derived(
		!page.route.id?.startsWith('/rankings') &&
			!page.route.id?.startsWith('/about') &&
			!page.route.id?.startsWith('/country')
	);

	let GlobeShell = $state<Component<{ active?: boolean }> | null>(null);

	readUrlState();

	$effect(() => {
		if (onGlobe) writeUrlState();
	});

	$effect(() => {
		if (!onGlobe || GlobeShell) return;
		import('$lib/components/globe/GlobeShell.svelte').then((m) => (GlobeShell = m.default));
	});

	onMount(() => {
		const mql = window.matchMedia('(pointer: coarse)');
		view.coarse = mql.matches;
		const on = (e: MediaQueryListEvent) => (view.coarse = e.matches);
		mql.addEventListener('change', on);
		return () => mql.removeEventListener('change', on);
	});

	function trackFocus(e: PointerEvent) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		view.focusX = e.clientX - r.left;
		view.focusY = e.clientY - r.top;
		view.hasFocus = true;
		view.overUI = (e.target as HTMLElement)?.tagName !== 'CANVAS';
	}
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={favicon} />
</svelte:head>

<div class="app-bg" aria-hidden="true"></div>

<div
	class="stage"
	class:zone-hover={!!ui.hovered}
	role="application"
	aria-label="Interactive ambient-exposure globe"
	onpointermove={trackFocus}
	onpointerleave={() => (view.hasFocus = false)}
	oncontextmenu={(e) => e.preventDefault()}
>
	{#if GlobeShell}
		<GlobeShell active={onGlobe} />
	{/if}
</div>

<div class="sr-only" aria-live="polite">
	{ui.selected ? `Opened ${ui.selected.name}` : ''}
</div>

{@render children()}

<style>
	.stage {
		cursor: grab;
	}
	.stage:active {
		cursor: grabbing;
	}
	.stage.zone-hover {
		cursor: pointer;
	}
	.app-bg {
		position: fixed;
		inset: 0;
		z-index: -1;
		background: #05070e;
	}
	.stage {
		position: fixed;
		inset: clamp(10px, 2vmin, 26px);
		border: 1px solid var(--line);
		border-radius: 13px;
		overflow: hidden;
		background: radial-gradient(
				130% 115% at 50% 26%,
				#0d1a31 0%,
				#091123 42%,
				#050810 74%,
				#03050b 100%
			)
			no-repeat;
		box-shadow:
			0 30px 90px rgba(0, 0, 0, 0.66),
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			inset 0 0 150px rgba(0, 0, 0, 0.6);
	}
</style>

<script lang="ts">
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import AirQualityLayer from '$lib/components/globe/AirQualityLayer.svelte';
	import Globe from '$lib/components/globe/Globe.svelte';
	import Labels from '$lib/components/globe/Labels.svelte';
	import ColorKey from '$lib/components/ui/ColorKey.svelte';
	import ComparePanel from '$lib/components/ui/ComparePanel.svelte';
	import Legend from '$lib/components/ui/Legend.svelte';
	import LocationInspector from '$lib/components/ui/LocationInspector.svelte';
	import MapNote from '$lib/components/ui/MapNote.svelte';
	import NonSpatialPanel from '$lib/components/ui/NonSpatialPanel.svelte';
	import Onboarding from '$lib/components/ui/Onboarding.svelte';
	import ReaderPanel from '$lib/components/ui/ReaderPanel.svelte';
	import Search from '$lib/components/ui/Search.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import ZoomConsole from '$lib/components/ui/ZoomConsole.svelte';
	import { ui } from '$lib/state/state.svelte';
	import { readUrlState, writeUrlState } from '$lib/state/url-state';
	import { view } from '$lib/state/viewport.svelte';
	import { onMount } from 'svelte';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { children }: LayoutProps = $props();

	const onGlobe = $derived(
		!page.route.id?.startsWith('/rankings') &&
			!page.route.id?.startsWith('/about') &&
			!page.route.id?.startsWith('/country')
	);

	readUrlState();

	$effect(() => {
		if (onGlobe) writeUrlState();
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
	<title>Ambient Atlas</title>
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
	<Globe active={onGlobe} />
	<div class="grain" aria-hidden="true"></div>
	{#if onGlobe}
		<AirQualityLayer />
		<Labels />
		<Search />
		<Legend />
		<ColorKey />
		<NonSpatialPanel />
		<MapNote />
		<ZoomConsole />
		<LocationInspector />
		<ComparePanel />
		<Tooltip />
		<ReaderPanel />
		<Onboarding />
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
	.grain {
		position: absolute;
		inset: 0;
		pointer-events: none;
		opacity: 0.04;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
		background-size: 160px 160px;
	}
	@media (prefers-reduced-motion: reduce) {
		.grain {
			display: none;
		}
	}
</style>

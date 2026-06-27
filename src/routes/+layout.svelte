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
	import { ui } from '$lib/state/state.svelte';
	import { readUrlState, writeUrlState } from '$lib/state/url-state';
	import { view } from '$lib/state/viewport.svelte';
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

	function trackFocus(e: PointerEvent) {
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		view.focusX = e.clientX - r.left;
		view.focusY = e.clientY - r.top;
		view.hasFocus = true;
	}
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" href={favicon} />
	<title>Ambient Atlas</title>
</svelte:head>

{#if onGlobe}
	<div
		class="stage"
		class:zone-hover={!!ui.hovered}
		role="application"
		aria-label="Interactive ambient-exposure globe"
		onpointermove={trackFocus}
		onpointerleave={() => (view.hasFocus = false)}
		oncontextmenu={(e) => e.preventDefault()}
	>
		<Globe />
		<AirQualityLayer />
		<Labels />
		<Search />
		<Legend />
		<ColorKey />
		<NonSpatialPanel />
		<MapNote />
		<LocationInspector />
		<ComparePanel />
		<Tooltip />
		<ReaderPanel />
		<Onboarding />
	</div>
{/if}

<div class="sr-only" aria-live="polite">
	{ui.selected ? `Opened ${ui.selected.name}` : ''}
</div>

{@render children()}

<style>
	.stage.zone-hover {
		cursor: pointer;
	}
	.stage {
		position: fixed;
		inset: clamp(10px, 2vmin, 26px);
		border: 1px solid var(--line);
		border-radius: 18px;
		overflow: hidden;
		background: radial-gradient(
				130% 115% at 50% 26%,
				#11203c 0%,
				#0a1326 40%,
				#060a14 72%,
				#04060d 100%
			)
			no-repeat;
		box-shadow:
			0 30px 90px rgba(0, 0, 0, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.05),
			inset 0 0 130px rgba(0, 0, 0, 0.55);
	}
</style>

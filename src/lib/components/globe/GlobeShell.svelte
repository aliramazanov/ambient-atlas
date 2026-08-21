<script lang="ts">
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
	import Search from '$lib/components/ui/Search.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import ZoomConsole from '$lib/components/ui/ZoomConsole.svelte';

	let { active = true }: { active?: boolean } = $props();
</script>

<Globe {active} />
<div class="grain" aria-hidden="true"></div>

{#if active}
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
	<Onboarding />
{/if}

<style>
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

<script lang="ts">
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import { zones } from '$lib/data/zones/zones';
	import { ui } from '$lib/state/state.svelte';

	const selected = $derived(zones.find((zz) => zz.id === page.params.id) ?? null);

	// Deep link: open the reader for the zone in the URL. The camera is left where
	// it is (clicking a dot should not move the globe); search/rankings fly on their
	// own. Keyed only on the resolved zone so it runs once per zone.
	$effect(() => {
		const z = selected;
		untrack(() => {
			ui.selected = z;
		});
	});
</script>

<svelte:head>
	<title>{selected ? `Ambient Atlas: ${selected.name}` : 'Ambient Atlas'}</title>
</svelte:head>

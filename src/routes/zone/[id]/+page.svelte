<script lang="ts">
	import { page } from '$app/state';
	import { zones } from '$lib/data/zones/zones';
	import { ui } from '$lib/state/state.svelte';
	import { untrack } from 'svelte';

	const selected = $derived(zones.find((zz) => zz.id === page.params.id) ?? null);

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

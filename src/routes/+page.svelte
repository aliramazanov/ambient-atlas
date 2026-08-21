<script lang="ts">
	import { page } from '$app/state';
	import Meta from '$lib/seo/Meta.svelte';
	import { zones } from '$lib/data/zones/zones';
	import { flyToLocation, ui } from '$lib/state/state.svelte';
	import { untrack } from 'svelte';


	$effect(() => {
		const search = page.url.search;
		untrack(() => {
			ui.selected = null;
			const fly = new URLSearchParams(search).get('fly');
			if (fly) {
				const [lat, lng] = fly.split(',').map(Number);
				if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
					flyToLocation(lat, lng);
					ui.probe = { lat, lng };
				}
			}
		});
	});
</script>

<Meta
	title="Ambient Atlas"
	description="An interactive globe of {zones.length} sourced places where the ambient environment shapes human health, from natural radiation to industrial contamination."
	path="/"
/>

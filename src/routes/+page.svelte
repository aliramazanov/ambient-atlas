<script lang="ts">
	import { page } from '$app/state';
	import { flyToLocation, ui } from '$lib/state/state.svelte';
	import { untrack } from 'svelte';

	// The index route shows the globe with no zone open. A ?fly=lat,lng param
	// (from the rankings page) flies to and inspects that location. Keyed only on
	// the URL; writes are untracked so this never self-triggers.

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

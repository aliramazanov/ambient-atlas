<script lang="ts">
	import { page } from '$app/state';
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

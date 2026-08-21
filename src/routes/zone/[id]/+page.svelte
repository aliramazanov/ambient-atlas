<script lang="ts">
	import { page } from '$app/state';
	import ReaderPanel from '$lib/components/ui/ReaderPanel.svelte';
	import { zones } from '$lib/data/zones/zones';
	import { summarize } from '$lib/seo/describe';
	import JsonLd from '$lib/seo/JsonLd.svelte';
	import Meta from '$lib/seo/Meta.svelte';
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

{#if selected}
	<Meta
		title="Ambient Atlas: {selected.name}"
		description={summarize(selected.desc)}
		path="/zone/{selected.id}"
		image="/og/{selected.category}.png"
		type="article"
	/>

	<JsonLd
		data={{
			'@context': 'https://schema.org',
			'@type': 'Place',
			name: selected.name,
			description: selected.desc,
			geo: {
				'@type': 'GeoCoordinates',
				latitude: selected.lat,
				longitude: selected.lng
			},
			additionalProperty: [
				{ '@type': 'PropertyValue', name: 'tier', value: selected.tier },
				{ '@type': 'PropertyValue', name: 'category', value: selected.category }
			],
			subjectOf: selected.citations.map((c) => ({
				'@type': 'CreativeWork',
				name: c.ref,
				url: c.url
			}))
		}}
	/>
{:else}
	<Meta
		title="Ambient Atlas"
		description="This exposure zone is not in the atlas."
		path="/zone/{page.params.id}"
	/>
{/if}

<ReaderPanel zone={selected} />

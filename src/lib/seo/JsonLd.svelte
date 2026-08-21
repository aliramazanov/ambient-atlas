<script lang="ts">
	let { data }: { data: Record<string, unknown> } = $props();

	const payload = $derived(JSON.stringify(data).replace(/</g, '\\u003c'));
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${payload}</script>`}
</svelte:head>

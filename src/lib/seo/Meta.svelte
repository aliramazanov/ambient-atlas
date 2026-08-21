<script lang="ts">
	import { absolute, siteName } from './site';

	interface Props {
		title: string;
		description: string;
		path: string;
		image?: string;
		type?: 'website' | 'article';
	}

	let { title, description, path, image = '/og/default.png', type = 'website' }: Props = $props();

	const url = $derived(absolute(path));
	const imageUrl = $derived(absolute(image));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	{#if url}<link rel="canonical" href={url} />{/if}

	<meta property="og:site_name" content={siteName} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	{#if url}<meta property="og:url" content={url} />{/if}
	{#if imageUrl}
		<meta property="og:image" content={imageUrl} />
		<meta property="og:image:width" content="1200" />
		<meta property="og:image:height" content="630" />
	{/if}

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	{#if imageUrl}<meta name="twitter:image" content={imageUrl} />{/if}
</svelte:head>

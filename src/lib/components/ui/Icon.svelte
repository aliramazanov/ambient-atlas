<script lang="ts">
	// Small consistent stroke icon set (currentColor).
	let {
		name,
		size = 16,
		stroke = 2
	}: { name: string; size?: number; stroke?: number } = $props();

	const P: Record<string, string> = {
		search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm10 2-4.35-4.35',
		close: 'M18 6 6 18M6 6l12 12',
		plus: 'M12 5v14M5 12h14',
		minus: 'M5 12h14',
		info: 'M12 16v-4M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
		pin: 'M12 21s-7-6.3-7-11a7 7 0 0 1 14 0c0 4.7-7 11-7 11zM12 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
		list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
		layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
		wind: 'M3 8h10a3 3 0 1 0-3-3M3 12h15a3 3 0 1 1-3 3M3 16h7a2.5 2.5 0 1 1-2.4 3',
		chevron: 'M9 6l6 6-6 6',
		globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3.5 12h17M12 3c2.6 2.7 4 6.2 4 9s-1.4 6.3-4 9c-2.6-2.7-4-6.2-4-9s1.4-6.3 4-9z',
		arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
		check: 'M20 6 9 17l-5-5',
		link: 'M9 15l6-6M10.5 6.5l1-1a4 4 0 0 1 6 6l-1 1M13.5 17.5l-1 1a4 4 0 0 1-6-6l1-1'
	};
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 24 24"
	fill="none"
	stroke="currentColor"
	stroke-width={stroke}
	stroke-linecap="round"
	stroke-linejoin="round"
	aria-hidden="true"
	style="display:block; flex:none;"
>
	<path d={P[name] ?? ''} />
</svg>

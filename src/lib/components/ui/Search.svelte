<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { cities, countryLabels } from '$lib/data/generated/places';
	import { zones } from '$lib/data/zones/zones';
	import { flyToLocation, ui } from '$lib/state/state.svelte';
	import { onMount, tick } from 'svelte';
	import Icon from './Icon.svelte';

	interface Item {
		name: string;
		sub: string;
		lat: number;
		lng: number;
		type: 'zone' | 'city' | 'country';
		id?: string;
	}

	const index: Item[] = [
		...zones.map((z) => ({ name: z.name, sub: z.tier, lat: z.lat, lng: z.lng, type: 'zone' as const, id: z.id })),
		...cities.map((c) => ({ name: c.name, sub: 'city', lat: c.lat, lng: c.lng, type: 'city' as const })),
		...countryLabels.map((c) => ({ name: c.name, sub: 'country', lat: c.lat, lng: c.lng, type: 'country' as const }))
	];

	let q = $state('');
	let open = $state(false);
	let active = $state(0);
	let root: HTMLElement | undefined = $state();
	let inputEl: HTMLInputElement | undefined = $state();
	let isMobile = $state(typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches);
	let searchOpen = $state(false);
	const fieldShown = $derived(!isMobile || searchOpen);
	const hidden = $derived(isMobile && ui.openPanel !== null && ui.openPanel !== 'search');
	onMount(() => {
		const mql = window.matchMedia('(max-width: 1023px)');
		const on = (e: MediaQueryListEvent) => (isMobile = e.matches);
		mql.addEventListener('change', on);
		return () => mql.removeEventListener('change', on);
	});
	$effect(() => {
		if (isMobile && ui.openPanel && ui.openPanel !== 'search') {
			searchOpen = false;
			open = false;
		}
	});
	async function openSearch() {
		searchOpen = true;
		ui.openPanel = 'search';
		await tick();
		inputEl?.focus();
	}
	function closeSearch() {
		searchOpen = false;
		open = false;
		if (ui.openPanel === 'search') ui.openPanel = null;
	}

	const results = $derived.by(() => {
		const s = q.trim().toLowerCase();
		if (s.length < 2) return [];

		const starts: Item[] = [];
		const contains: Item[] = [];

		for (const it of index) {
			const n = it.name.toLowerCase();
			if (n.startsWith(s)) starts.push(it);
			else if (n.includes(s)) contains.push(it);
			if (starts.length >= 8) break;
		}

		return [...starts, ...contains].slice(0, 8);
	});

	function choose(it: Item) {
		const dist = it.type === 'country' ? 2.6 : it.type === 'city' ? 1.9 : undefined;
		flyToLocation(it.lat, it.lng, dist);

		q = it.name;
		closeSearch();

		if (it.type === 'zone' && it.id) goto(resolve('/zone/[id]', { id: it.id }));
		else ui.probe = { lat: it.lat, lng: it.lng };
	}

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			open = false;
			return;
		}

		if (!open || !results.length) {
			if (e.key === 'ArrowDown') open = true;
			return;
		}

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				active = Math.min(results.length - 1, active + 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				active = Math.max(0, active - 1);
				break;
			case 'Enter':
				e.preventDefault();
				if (results[active]) choose(results[active]);
				break;
		}
	}

	function onWindowPointer(e: PointerEvent) {
		if (open && root && !root.contains(e.target as Node)) open = false;
	}
</script>

<svelte:window onpointerdown={onWindowPointer} />

{#if isMobile && searchOpen}
	<button class="scrim" onclick={closeSearch} aria-label="Close search"></button>
{/if}
<div class="search" bind:this={root} class:open={fieldShown}>
	{#if fieldShown}
		<div class="field">
			<span class="ic"><Icon name="search" size={15} /></span>
			<input
				bind:this={inputEl}
				type="text"
				placeholder="Search a city, country, or zone..."
				aria-label="Search a city, country, or zone"
				role="combobox"
				aria-autocomplete="list"
				aria-controls="search-results"
				aria-expanded={open && results.length > 0}
				aria-activedescendant={open && results.length ? `search-opt-${active}` : undefined}
				bind:value={q}
				onfocus={() => (open = true)}
				oninput={() => {
					open = true;
					active = 0;
				}}
				onblur={() => {
					if (isMobile && !q.trim()) closeSearch();
				}}
				onkeydown={onKeydown}
			/>
		</div>
		{#if open && results.length}
			<ul class="results" id="search-results" role="listbox" aria-label="Search results">
				{#each results as it, i (it.type + it.name + it.lat)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- Keyboard handled on the combobox input via aria-activedescendant. -->
					<li
						id="search-opt-{i}"
						role="option"
						aria-selected={i === active}
						class:active={i === active}
						onpointerenter={() => (active = i)}
						onclick={() => choose(it)}
					>
						<span class="rname">{it.name}</span>
						<span class="rsub">{it.sub}</span>
					</li>
				{/each}
			</ul>
		{:else if open && q.trim().length >= 2}
			<div class="noresults">No matches for "{q.trim()}"</div>
		{/if}
	{:else if !hidden}
		<button class="searchbtn" onclick={openSearch} aria-label="Search">
			<Icon name="search" size={16} />
		</button>
	{/if}
</div>

<style>
	.search {
		position: absolute;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 35;
		width: min(380px, 64vw);
	}
	.search:not(.open) {
		width: auto;
	}
	.searchbtn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		color: var(--muted);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		box-shadow: var(--shadow-sm);
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
		cursor: pointer;
	}
	.searchbtn:hover {
		color: var(--text);
		border-color: var(--line-strong);
	}
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 19;
		border: none;
		background: rgba(3, 5, 9, 0.45);
		backdrop-filter: blur(1px);
		cursor: default;
	}
	@media (max-width: 1023px) {
		.search.open {
			top: 66px;
			width: calc(100vw - 32px);
		}
	}
	.field {
		position: relative;
	}
	.ic {
		position: absolute;
		left: 13px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--muted);
		pointer-events: none;
	}
	.noresults {
		margin-top: 6px;
		padding: 10px 14px;
		font-size: 12px;
		color: var(--muted);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 12px;
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
	}
	input {
		width: 100%;
		padding: 11px 15px 11px 38px;
		font-size: 13px;
		color: var(--text);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 8px;
		box-shadow: var(--shadow-sm);
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
		transition:
			border-color 0.15s ease,
			box-shadow 0.15s ease;
	}
	input:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft), var(--shadow-sm);
	}
	input::placeholder {
		color: var(--muted);
	}
	.results {
		list-style: none;
		margin: 6px 0 0;
		padding: 4px;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 8px;
		backdrop-filter: blur(8px);
		max-height: 320px;
		overflow-y: auto;
	}
	.results li {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		color: var(--text);
		text-align: left;
		padding: 7px 9px;
		border-radius: 7px;
		cursor: pointer;
		font-size: 12.5px;
	}
	.results li.active {
		background: rgba(255, 255, 255, 0.07);
	}
	.rsub {
		color: var(--faint);
		font-family: var(--font-mono);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.12em;
	}
</style>

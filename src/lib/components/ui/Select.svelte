<script lang="ts">
	import { tick } from 'svelte';
	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';

	interface Option {
		value: string;
		label: string;
	}

	let {
		value = $bindable(),
		options,
		label = 'Select an option',
		id = 'select'
	}: { value: string; options: Option[]; label?: string; id?: string } = $props();

	let isOpen = $state(false);
	let active = $state(0);
	let trigger: HTMLButtonElement | undefined = $state();
	let list: HTMLUListElement | undefined = $state();
	let menuStyle = $state('');

	const selected = $derived(options.find((o) => o.value === value));
	const selectedLabel = $derived(selected?.label ?? '');

	let typed = '';
	let typedAt = 0;

	function place() {
		if (!trigger) return;
		const r = trigger.getBoundingClientRect();
		const estH = Math.min(260, options.length * 34 + 12);
		const below = window.innerHeight - r.bottom;
		const up = below < estH + 14 && r.top > below;
		const top = up ? r.top - estH - 6 : r.bottom + 6;
		menuStyle = `position:fixed; top:${Math.round(top)}px; left:${Math.round(r.left)}px; width:${Math.round(r.width)}px;`;
	}

	async function open() {
		place();
		isOpen = true;
		active = Math.max(
			0,
			options.findIndex((o) => o.value === value)
		);
		await tick();
		scrollActive();
	}

	$effect(() => {
		if (!isOpen) return;
		const reposition = () => place();
		window.addEventListener('scroll', reposition, true);
		window.addEventListener('resize', reposition);
		return () => {
			window.removeEventListener('scroll', reposition, true);
			window.removeEventListener('resize', reposition);
		};
	});

	function close(refocus = true) {
		isOpen = false;
		if (refocus) trigger?.focus();
	}

	function choose(i: number) {
		if (i < 0 || i >= options.length) return;
		value = options[i].value;
		close();
	}

	function scrollActive() {
		list?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
	}

	function move(to: number) {
		active = Math.max(0, Math.min(options.length - 1, to));
		scrollActive();
	}

	function typeahead(key: string) {
		const now = Date.now();
		typed = now - typedAt > 700 ? key : typed + key;
		typedAt = now;
		const i = options.findIndex((o) => o.label.toLowerCase().startsWith(typed.toLowerCase()));
		if (i >= 0) move(i);
	}

	function onKeydown(e: KeyboardEvent) {
		if (!isOpen) {
			if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				open();
			}
			return;
		}
		switch (e.key) {
			case 'Escape':
				e.preventDefault();
				close();
				break;
			case 'ArrowDown':
				e.preventDefault();
				move(active + 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				move(active - 1);
				break;
			case 'Home':
				e.preventDefault();
				move(0);
				break;
			case 'End':
				e.preventDefault();
				move(options.length - 1);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				choose(active);
				break;
			case 'Tab':
				close(false);
				break;
			default:
				if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) typeahead(e.key);
		}
	}

	function onWindowPointer(e: PointerEvent) {
		if (!isOpen) return;
		const t = e.target as Node;
		if (!trigger?.contains(t) && !list?.contains(t)) close(false);
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				node.remove();
			}
		};
	}
</script>

<svelte:window onpointerdown={onWindowPointer} />

<div class="select">
	<button
		bind:this={trigger}
		type="button"
		class="trigger"
		class:open={isOpen}
		role="combobox"
		aria-haspopup="listbox"
		aria-controls="{id}-list"
		aria-expanded={isOpen}
		aria-label={label}
		aria-activedescendant={isOpen ? `${id}-opt-${active}` : undefined}
		onclick={() => (isOpen ? close() : open())}
		onkeydown={onKeydown}
	>
		<span class="val">{selectedLabel}</span>
		<span class="chev" class:open={isOpen}><Icon name="chevron" size={13} /></span>
	</button>

	{#if isOpen}
		<ul
			use:portal
			bind:this={list}
			id="{id}-list"
			class="list"
			style={menuStyle}
			role="listbox"
			tabindex="-1"
			aria-label={label}
			transition:fly={{ y: -4, duration: 130 }}
		>
			{#each options as o, i (o.value)}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- Keyboard handled on the combobox via aria-activedescendant. -->
				<li
					id="{id}-opt-{i}"
					role="option"
					aria-selected={o.value === value}
					data-active={i === active}
					class:active={i === active}
					class:selected={o.value === value}
					onpointerenter={() => (active = i)}
					onclick={() => choose(i)}
				>
					<span class="opt-label">{o.label}</span>
					{#if o.value === value}<span class="opt-check"><Icon name="check" size={13} /></span>{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.select {
		position: relative;
	}
	.trigger {
		display: flex;
		width: 100%;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		padding: 7px 11px;
		font-size: 11.5px;
		color: var(--text);
		background: rgba(0, 0, 0, 0.32);
		border: 1px solid var(--line);
		border-radius: 8px;
		cursor: pointer;
		transition:
			border-color var(--dur) var(--ease),
			box-shadow var(--dur) var(--ease);
	}
	.trigger:hover {
		border-color: var(--line-strong);
	}
	.trigger.open,
	.trigger:focus-visible {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 3px var(--accent-soft);
	}
	.val {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.chev {
		display: flex;
		color: var(--muted);
		transition: transform var(--dur) var(--ease);
	}
	.chev.open {
		transform: rotate(90deg);
	}
	.list {
		z-index: 200;
		max-height: 260px;
		overflow-y: auto;
		margin: 0;
		padding: 5px;
		list-style: none;
		background: var(--panel);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius-sm);
		box-shadow: var(--shadow);
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
	}
	.list li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding: 8px 10px;
		font-size: 12px;
		color: var(--text);
		border-radius: 7px;
		cursor: pointer;
		transition: background var(--dur) var(--ease);
	}
	.list li.active {
		background: var(--accent-soft);
		color: var(--gold);
	}
	.list li.selected {
		color: var(--accent);
		font-weight: 600;
	}
	.opt-check {
		display: flex;
		color: var(--accent);
	}
</style>

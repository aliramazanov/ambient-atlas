<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';
	import Icon from './Icon.svelte';

	interface Props extends HTMLButtonAttributes {
		label: string;
		icon?: string;
		active?: boolean;
		class?: string;
		trailing?: Snippet;
	}

	let { label, icon, active = false, class: klass = '', trailing, ...rest }: Props = $props();
</script>

<button class={cn('toggle', active && 'active', klass)} {...rest}>
	<span class="lbl">
		{#if icon}<Icon name={icon} size={14} />{/if}
		{label}
	</span>
	{#if trailing}<span class="trail">{@render trailing()}</span>{/if}
</button>

<style>
	.toggle {
		width: 100%;
		text-align: left;
		font-size: 12px;
		font-weight: 600;
		color: var(--text);
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 10px 12px;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 10px;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		transition:
			color var(--dur) var(--ease),
			background var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.toggle:hover {
		border-color: var(--line-strong);
	}
	.toggle.active {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.lbl {
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.trail {
		display: inline-flex;
		align-items: center;
	}
</style>

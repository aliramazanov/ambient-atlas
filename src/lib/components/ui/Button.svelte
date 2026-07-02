<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'outline' | 'ghost' | 'icon';
		size?: 'sm' | 'md' | 'icon';
		active?: boolean;
		class?: string;
		children?: Snippet;
	}

	let {
		variant = 'outline',
		size = 'md',
		active = false,
		class: klass = '',
		children,
		...rest
	}: Props = $props();
</script>

<button class={cn('btn', `v-${variant}`, `s-${size}`, active && 'active', klass)} {...rest}>
	{@render children?.()}
</button>

<style>
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		font-weight: 600;
		color: var(--text);
		border: 1px solid transparent;
		border-radius: 10px;
		cursor: pointer;
		transition:
			color var(--dur) var(--ease),
			background var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.btn:active {
		transform: translateY(0.5px);
	}

	.v-outline {
		background: var(--panel);
		border-color: var(--line);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}
	.v-outline:hover {
		color: var(--text);
		border-color: var(--line-strong);
	}
	.v-ghost {
		background: transparent;
		color: var(--muted);
	}
	.v-ghost:hover {
		color: var(--text);
		background: var(--line);
	}
	.v-icon {
		background: rgba(255, 255, 255, 0.06);
		border-color: var(--line);
		color: var(--muted);
		border-radius: 8px;
	}
	.v-icon:hover {
		color: var(--text);
		background: rgba(255, 255, 255, 0.12);
		border-color: var(--line-strong);
	}

	.s-sm {
		padding: 8px 10px;
		font-size: 11.5px;
	}
	.s-md {
		padding: 10px 12px;
		font-size: 12px;
	}
	.s-icon {
		width: var(--btn-size, 32px);
		height: var(--btn-size, 32px);
		padding: 0;
		border-radius: 8px;
	}

	.active {
		color: var(--accent);
		background: var(--accent-soft);
		border-color: var(--accent);
	}
</style>

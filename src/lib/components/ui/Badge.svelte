<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		active?: boolean;
		class?: string;
		children?: Snippet;
	}

	let { active = false, class: klass = '', children, ...rest }: Props = $props();
</script>

<span class={cn('badge', active && 'active', klass)} {...rest}>{@render children?.()}</span>

<style>
	.badge {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.05em;
		padding: 2px 7px;
		border-radius: 999px;
		border: 1px solid var(--line-strong);
		color: var(--muted);
	}
	.active {
		color: var(--accent);
		border-color: var(--accent);
	}
</style>

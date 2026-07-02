<script lang="ts">
	import { cn } from '$lib/utils/cn';
	import { onMount, type Snippet } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	interface Props {
		onclose: () => void;
		label: string;
		width?: string;
		class?: string;
		children: Snippet;
	}

	let { onclose, label, width = 'min(680px, 100%)', class: klass = '', children }: Props = $props();

	let panelEl: HTMLElement | undefined = $state();
	let lastFocused: HTMLElement | null = null;

	function focusable(): HTMLElement[] {
		if (!panelEl) return [];
		return Array.from(
			panelEl.querySelectorAll<HTMLElement>(
				'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => el.offsetParent !== null);
	}

	onMount(() => {
		lastFocused = document.activeElement as HTMLElement;
		queueMicrotask(() => focusable()[0]?.focus());
		return () => lastFocused?.focus?.();
	});

	function onkeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			onclose();
			return;
		}
		if (e.key !== 'Tab') return;
		const els = focusable();
		if (!els.length) return;
		const first = els[0];
		const last = els[els.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}
</script>

<svelte:window {onkeydown} />

<div
	class="backdrop"
	transition:fade={{ duration: 160 }}
	onclick={(e) => {
		if (e.target === e.currentTarget) onclose();
	}}
	role="presentation"
>
	<div
		class={cn('dialog', klass)}
		bind:this={panelEl}
		style="width:{width}"
		transition:scale={{ duration: 200, start: 0.96 }}
		role="dialog"
		aria-modal="true"
		aria-label={label}
		tabindex={-1}
	>
		{@render children()}
	</div>
</div>

<style>
	.backdrop {
		position: fixed;
		inset: 0;
		z-index: 60;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(3, 5, 9, 0.6);
		backdrop-filter: blur(4px);
		padding: 24px;
	}
	.dialog {
		position: relative;
		display: flex;
		flex-direction: column;
	}
	@media (max-width: 620px) {
		.backdrop {
			padding: 10px;
		}
	}
</style>

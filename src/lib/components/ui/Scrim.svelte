<script lang="ts">
	interface Props {
		onclose: () => void;
		label?: string;
	}

	let { onclose, label = 'Close' }: Props = $props();
</script>

<button class="scrim" onclick={onclose} aria-label={label}></button>

<style>
	.scrim {
		position: fixed;
		inset: 0;
		z-index: 19;
		border: none;
		background: rgba(3, 5, 9, 0.45);
		backdrop-filter: blur(1px);
		cursor: default;
	}
</style>

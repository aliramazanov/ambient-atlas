<script lang="ts">
	// Premium range slider: native input under the hood (fully accessible) with a
	// gold-filled track and a glowing thumb.
	let {
		value = $bindable(),
		min = 0,
		max = 1,
		step = 0.1,
		label = ''
	}: { value: number; min?: number; max?: number; step?: number; label?: string } = $props();

	const pct = $derived(Math.round(((value - min) / (max - min)) * 100));
</script>

<input
	class="slider"
	type="range"
	{min}
	{max}
	{step}
	bind:value
	aria-label={label}
	style="--pct:{pct}%"
/>

<style>
	.slider {
		-webkit-appearance: none;
		appearance: none;
		width: 100%;
		height: 16px;
		background: transparent;
		cursor: pointer;
	}
	.slider::-webkit-slider-runnable-track {
		height: 5px;
		border-radius: 999px;
		background: linear-gradient(
			to right,
			var(--accent) var(--pct),
			rgba(255, 255, 255, 0.12) var(--pct)
		);
	}
	.slider::-moz-range-track {
		height: 5px;
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.12);
	}
	.slider::-moz-range-progress {
		height: 5px;
		border-radius: 999px;
		background: var(--accent);
	}
	.slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 14px;
		height: 14px;
		margin-top: -4.5px;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #f3dca0, #d9b46a);
		border: 1px solid rgba(0, 0, 0, 0.4);
		box-shadow:
			0 1px 4px rgba(0, 0, 0, 0.5),
			0 0 8px rgba(217, 180, 106, 0.5);
	}
	.slider::-moz-range-thumb {
		width: 13px;
		height: 13px;
		border: none;
		border-radius: 50%;
		background: radial-gradient(circle at 30% 30%, #f3dca0, #d9b46a);
		box-shadow:
			0 1px 4px rgba(0, 0, 0, 0.5),
			0 0 8px rgba(217, 180, 106, 0.5);
	}
	.slider:focus-visible {
		outline: none;
	}
	.slider:focus-visible::-webkit-slider-thumb {
		box-shadow:
			0 0 0 3px var(--accent-soft),
			0 1px 4px rgba(0, 0, 0, 0.5);
	}
	.slider:focus-visible::-moz-range-thumb {
		box-shadow:
			0 0 0 3px var(--accent-soft),
			0 1px 4px rgba(0, 0, 0, 0.5);
	}
</style>

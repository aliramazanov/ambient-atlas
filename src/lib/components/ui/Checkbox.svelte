<script lang="ts">
	import Icon from './Icon.svelte';


	let {
		checked = $bindable(),
		label = ''
	}: { checked: boolean; label?: string } = $props();
</script>

<label class="cb">
	<input type="checkbox" bind:checked />
	<span class="box" aria-hidden="true">
		{#if checked}<Icon name="check" size={11} stroke={2.4} />{/if}
	</span>
	{#if label}<span class="lbl">{label}</span>{/if}
</label>

<style>
	.cb {
		display: flex;
		align-items: center;
		gap: 9px;
		cursor: pointer;
		font-size: 13px;
		color: var(--text);
	}
	.cb input {
		position: absolute;
		opacity: 0;
		width: 1px;
		height: 1px;
		margin: -1px;
	}
	.box {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		flex: none;
		border-radius: 5px;
		border: 1px solid var(--line-strong);
		background: rgba(0, 0, 0, 0.25);
		color: #0b1320;
		transition:
			background var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.box :global(svg) {
		display: block;
	}
	.cb:hover .box {
		border-color: var(--accent);
	}
	.cb input:checked + .box {
		background: var(--accent);
		border-color: var(--accent);
	}
	.cb input:focus-visible + .box {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
</style>

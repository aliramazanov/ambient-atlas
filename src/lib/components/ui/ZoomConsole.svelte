<script lang="ts">
	import { view, zoomBy, zoomLevel } from '$lib/state/viewport.svelte';
	import Icon from './Icon.svelte';

	const lvl = $derived(zoomLevel());
	const pct = $derived(Math.round(lvl * 100));

	void view;
</script>

<div class="zoomc glass" role="group" aria-label="Globe zoom">
	<button class="zb" onclick={() => zoomBy(1.28)} aria-label="Zoom out" title="Zoom out">
		<Icon name="minus" size={14} stroke={2.2} />
	</button>

	<div class="track" aria-hidden="true">
		<span class="fill" style="width:{lvl * 100}%"></span>
		<span class="marker" style="left:{lvl * 100}%"></span>
	</div>

	<button class="zb" onclick={() => zoomBy(0.78)} aria-label="Zoom in" title="Zoom in">
		<Icon name="plus" size={14} stroke={2.2} />
	</button>

	<div class="read">
		<span class="num">{pct}</span>
		<span class="unit">ZM</span>
	</div>
</div>

<style>
	.zoomc {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: 16px;
		z-index: 30;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 11px;
		padding: 7px 12px;
	}
	.zb {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 24px;
		height: 24px;
		flex: none;
		border-radius: var(--radius-sm);
		border: 1px solid var(--line);
		background: rgba(255, 255, 255, 0.04);
		color: var(--muted);
		cursor: pointer;
		transition:
			color var(--dur) var(--ease),
			background var(--dur) var(--ease),
			border-color var(--dur) var(--ease);
	}
	.zb:hover {
		color: var(--gold);
		background: var(--accent-soft);
		border-color: var(--line-strong);
	}
	.zb:active {
		transform: translateY(0.5px);
	}
	.track {
		position: relative;
		width: 134px;
		height: 3px;
		border-radius: 3px;
		background: rgba(255, 255, 255, 0.07);
	}
	.fill {
		position: absolute;
		left: 0;
		top: 0;
		height: 100%;
		border-radius: 3px;
		background: linear-gradient(
			to right,
			rgba(203, 168, 105, 0.35),
			rgba(227, 197, 133, 0.9)
		);
	}
	.marker {
		position: absolute;
		top: -2px;
		width: 2px;
		height: 7px;
		background: var(--gold);
		box-shadow: 0 0 5px rgba(227, 197, 133, 0.6);
		transform: translateX(-1px);
	}
	.read {
		display: flex;
		align-items: baseline;
		gap: 3px;
		font-family: var(--font-mono);
		font-variant-numeric: tabular-nums;
		padding-left: 2px;
	}
	.num {
		font-size: 11px;
		font-weight: 700;
		color: var(--text);
	}
	.unit {
		font-size: 8px;
		letter-spacing: 0.16em;
		color: var(--faint);
	}
</style>

<script lang="ts">
	import { categoryColor } from '$lib/data/scales/categories';
	import { dots, researchOf, severityOf } from '$lib/data/scales/severity';
	import { statusOf } from '$lib/data/scales/status';
	import { openZone, ui } from '$lib/state/state.svelte';
	import { view } from '$lib/state/viewport.svelte';

	function openHovered() {
		if (ui.hovered) openZone(ui.hovered);
	}
</script>

{#if ui.hovered && !view.moving}
	{@const st = statusOf(ui.hovered)}
	<div
		class="tip"
		class:tappable={view.coarse}
		style={view.coarse ? '' : `left:${ui.pointer.x + 16}px; top:${ui.pointer.y + 16}px;`}
		role="button"
		tabindex={view.coarse ? 0 : -1}
		aria-label="Open this exposure"
		onclick={openHovered}
		onkeydown={(e: KeyboardEvent) => {
			if (e.key === 'Enter' || e.key === ' ') openHovered();
		}}
	>
		<div class="name">
			<span class="dot" style="background:{categoryColor(ui.hovered)}"></span>
			{ui.hovered.name}
		</div>
		<div class="status" style="color:{st.color}">
			<span class="sdot" style="background:{st.color}"></span>{st.label}
		</div>
		<div class="desc">{ui.hovered.desc}</div>
		<div class="sr">
			severity {dots(severityOf(ui.hovered))} · researched {dots(researchOf(ui.hovered))}
		</div>
		<div class="hint">{view.coarse ? 'Tap to open' : 'left-click to read, right-click to pin its reach'}</div>
	</div>
{/if}

<style>
	.tip {
		position: fixed;
		z-index: 40;
		max-width: 290px;
		padding: 11px 13px;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
		backdrop-filter: var(--glass-filter);
		-webkit-backdrop-filter: var(--glass-filter);
		pointer-events: none;
		box-shadow: var(--shadow);
	}
	/* On touch the tip is a clamped, full-width card near the bottom so it always
	   reads fully instead of overflowing off the tapped point. */
	.tip.tappable {
		pointer-events: auto;
		cursor: pointer;
		left: 12px;
		right: 12px;
		top: auto;
		bottom: calc(env(safe-area-inset-bottom, 0px) + 78px);
		max-width: none;
		padding: 14px 16px;
	}
	.name {
		font-weight: 700;
		font-size: 13px;
		display: flex;
		align-items: center;
		gap: 7px;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		display: inline-block;
	}
	.status {
		margin-top: 4px;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.03em;
		display: flex;
		align-items: center;
		gap: 5px;
	}
	.sdot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}
	.desc {
		margin-top: 5px;
		font-size: 12px;
		line-height: 1.4;
		color: var(--muted);
	}
	.sr {
		margin-top: 6px;
		font-family: var(--font-mono);
		font-size: 10.5px;
		color: #a9b6c9;
		letter-spacing: 0.3px;
	}
	.hint {
		margin-top: 6px;
		font-family: var(--font-mono);
		font-size: 9.5px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.35);
	}
</style>

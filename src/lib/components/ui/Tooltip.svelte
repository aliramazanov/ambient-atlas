<script lang="ts">
	import { ui } from '$lib/state/state.svelte';
	import { categoryColor } from '$lib/data/scales/categories';
	import { severityOf, researchOf, dots } from '$lib/data/scales/severity';
	import { statusOf } from '$lib/data/scales/status';
</script>

{#if ui.hovered}
	{@const st = statusOf(ui.hovered)}
	<div class="tip" style="left:{ui.pointer.x + 16}px; top:{ui.pointer.y + 16}px;">
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
		<div class="hint">left-click to read, right-click to pin its reach</div>
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
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
		pointer-events: none;
		box-shadow: var(--shadow);
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
		font-size: 11px;
		color: #a9b6c9;
		letter-spacing: 0.5px;
	}
	.hint {
		margin-top: 6px;
		font-size: 10px;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.35);
	}
</style>

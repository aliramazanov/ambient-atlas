<script lang="ts">
	import { categoryColor, CERTAINTY_LABEL } from '$lib/data/scales/categories';
	import { reachKm } from '$lib/data/scales/reach';
	import { dots, researchOf, severityOf } from '$lib/data/scales/severity';
	import { statusOf } from '$lib/data/scales/status';
	import { HEALTH } from '$lib/data/zones/health';
	import { zones } from '$lib/data/zones/zones';
	import { ui } from '$lib/state/state.svelte';
	import { fly } from 'svelte/transition';
	import Icon from './Icon.svelte';

	const items = $derived(
		ui.compare.map((id) => zones.find((z) => z.id === id)).filter((z) => z != null)
	);

	function remove(id: string) {
		ui.compare = ui.compare.filter((x) => x !== id);
	}
</script>

{#if items.length}
	<div class="compare" transition:fly={{ y: 16, duration: 160 }}>
		<div class="head">
			<span>Compare ({items.length})</span>
			<button class="icon-btn clear" onclick={() => (ui.compare = [])} aria-label="Clear comparison">
				<Icon name="close" size={14} />
			</button>
		</div>
		<div class="cols">
			{#each items as z (z.id)}
				<div class="col">
					<button class="icon-btn rm" onclick={() => remove(z.id)} aria-label="Remove">
						<Icon name="close" size={12} />
					</button>
					<div class="name"><span class="dot" style="background:{categoryColor(z)}"></span>{z.name}</div>
					<div class="row"><span>Status</span><b style="color:{statusOf(z).color}">{statusOf(z).label}</b></div>
					<div class="row"><span>Type</span><b>{z.category}</b></div>
					{#if z.certainty}<div class="row"><span>Certainty</span><b>{CERTAINTY_LABEL[z.certainty]}</b></div>{/if}
					<div class="row"><span>Severity</span><b class="dt">{dots(severityOf(z))}</b></div>
					<div class="row"><span>Research</span><b class="dt">{dots(researchOf(z))}</b></div>
					<div class="row"><span>Reach</span><b>{reachKm(z)} km</b></div>
					<div class="health">{z.health ?? HEALTH[z.id] ?? ''}</div>
				</div>
			{/each}
		</div>
	</div>
{/if}

<style>
	.compare {
		position: absolute;
		left: 50%;
		bottom: 58px;
		transform: translateX(-50%);
		z-index: 32;
		max-width: min(760px, calc(100% - 32px));
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		box-shadow: var(--shadow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
		padding: 12px 14px;
	}
	.head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
		margin-bottom: 10px;
	}
	.clear {
		width: 24px;
		height: 24px;
	}
	.cols {
		display: flex;
		gap: 12px;
		overflow-x: auto;
	}
	.col {
		position: relative;
		min-width: 200px;
		flex: 1;
		padding: 10px 12px;
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid var(--line);
		border-radius: var(--radius-sm);
	}
	.rm {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 20px;
		height: 20px;
	}
	.name {
		font-weight: 600;
		font-size: 13px;
		display: flex;
		align-items: center;
		gap: 7px;
		margin-bottom: 8px;
		padding-right: 22px;
	}
	.dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 10px;
		font-size: 12px;
		padding: 2px 0;
	}
	.row span {
		color: var(--muted);
	}
	.dt {
		letter-spacing: 1px;
	}
	.health {
		margin-top: 8px;
		font-size: 11.5px;
		line-height: 1.45;
		color: var(--muted);
	}
</style>

<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, scale } from 'svelte/transition';

	let show = $state(false);

	onMount(() => {
		try {
			show = !localStorage.getItem('aa_onboarded');
		} catch {
			show = true;
		}
	});

	function dismiss() {
		show = false;
		try {
			localStorage.setItem('aa_onboarded', '1');
		} catch {
			/* ignore */
		}
	}
</script>

{#if show}
	<div class="ob" transition:fade={{ duration: 180 }}>
		<div class="card" transition:scale={{ duration: 220, start: 0.96 }}>
			<h2>Ambient Atlas</h2>
			<p>
				A cited world map of places where people live inside a chronic, largely unavoidable
				exposure, natural or man-made. Drag to rotate, scroll to zoom, hover a zone for a summary,
				click it to read more. Names appear where you point.
			</p>
			<ul class="tiers">
				<li><span class="dot" style="background:#f2c14e"></span><span><b>Established</b>: real, at least partly studied exposures.</span></li>
				<li><span class="dot" style="background:#aeb8c7"></span><span><b>Gray</b>: real exposure, open or contested health question.</span></li>
				<li><span class="dot" style="background:#62d49a"></span><span><b>Solved</b>: a local mystery whose natural cause was found.</span></li>
				<li><span class="dot" style="background:#ef7a93"></span><span><b>Anthropogenic / Conflict</b>: man-made disasters and war zones.</span></li>
			</ul>
			<p class="warn">
				Absence of a marker is not proof of safety. The map is illustrative and incomplete; gray
				zones mark open questions, not established risk.
			</p>
			<p class="tip">Tip: click empty ocean or land to inspect any location, or use search.</p>
			<button onclick={dismiss}>Explore the globe</button>
		</div>
	</div>
{/if}

<style>
	.ob {
		position: fixed;
		inset: 0;
		z-index: 80;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(3, 5, 9, 0.66);
		backdrop-filter: blur(5px);
		padding: 24px;
	}
	.card {
		width: min(520px, 100%);
		background: rgba(9, 13, 21, 0.95);
		border: 1px solid var(--line);
		border-radius: 14px;
		padding: 26px 28px;
		box-shadow: 0 24px 70px rgba(0, 0, 0, 0.55);
	}
	h2 {
		margin: 0 0 10px;
		font-size: 22px;
	}
	p {
		font-size: 14px;
		line-height: 1.6;
		color: var(--text);
	}
	ul.tiers {
		list-style: none;
		margin: 14px 0;
		padding: 0;
		font-size: 13px;
		line-height: 1.6;
		color: var(--muted);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	ul.tiers li {
		display: flex;
		align-items: baseline;
		gap: 9px;
	}
	ul.tiers .dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		flex: none;
		transform: translateY(2px);
		box-shadow: 0 0 8px rgba(255, 255, 255, 0.12);
	}
	ul b {
		color: var(--text);
	}
	.warn {
		font-size: 12.5px;
		color: #ffcf99;
		border-left: 2px solid #ffcf99;
		padding-left: 10px;
	}
	.tip {
		font-size: 12px;
		color: var(--muted);
	}
	button {
		margin-top: 12px;
		width: 100%;
		padding: 10px;
		font-size: 14px;
		font-weight: 600;
		color: #06121f;
		background: #d9b46a;
		border: none;
		border-radius: 9px;
		cursor: pointer;
	}
</style>

<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { categoryColor, CERTAINTY_LABEL } from '$lib/data/scales/categories';
	import { dots, researchOf, severityOf } from '$lib/data/scales/severity';
	import { statusOf } from '$lib/data/scales/status';
	import { HEALTH } from '$lib/data/zones/health';
	import type { EmissionType } from '$lib/data/zones/types';
	import { ui } from '$lib/state/state.svelte';
	import { fade, scale } from 'svelte/transition';
	import Icon from './Icon.svelte';

	let closeBtn: HTMLButtonElement | undefined = $state();
	let panelEl: HTMLElement | undefined = $state();
	let lastFocused: HTMLElement | null = null;

	$effect(() => {
		if (ui.selected) {
			if (!lastFocused) lastFocused = document.activeElement as HTMLElement;
			closeBtn?.focus();
		} else if (lastFocused) {
			lastFocused.focus?.();
			lastFocused = null;
		}
	});

	function trapTab(e: KeyboardEvent) {
		if (e.key !== 'Tab' || !panelEl) return;

		const els = Array.from(
			panelEl.querySelectorAll<HTMLElement>(
				'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])'
			)
		).filter((el) => el.offsetParent !== null);

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

	const EMISSION_LABEL: Record<EmissionType, string> = {
		ionizing: 'Ionizing radiation',
		rf: 'Radio-frequency / microwave',
		chemical: 'Chemical / geochemical',
		mixed: 'Mixed'
	};

	function close() {
		ui.selected = null;
		if (page.route.id?.startsWith('/zone')) goto(resolve('/'));
	}

	function addCompare(id: string) {
		if (!ui.compare.includes(id) && ui.compare.length < 4) ui.compare = [...ui.compare, id];
	}

	function handleKey(e: KeyboardEvent) {
		if (e.key === 'Escape') close();
	}
</script>

<svelte:window onkeydown={handleKey} />

{#if ui.selected}
	{@const z = ui.selected}
	{@const st = statusOf(z)}
	<div
		class="backdrop"
		transition:fade={{ duration: 160 }}
		onclick={(e) => {
			if (e.target === e.currentTarget) close();
		}}
		role="presentation"
	>
		<div
			class="panel"
			bind:this={panelEl}
			transition:scale={{ duration: 200, start: 0.96 }}
			role="dialog"
			aria-modal="true"
			aria-label={z.name}
			tabindex={-1}
			onkeydown={trapTab}
		>
			<div class="accent" style="background:{categoryColor(z)}"></div>
			<button class="close icon-btn" bind:this={closeBtn} onclick={close} aria-label="Close">
				<Icon name="close" size={16} />
			</button>

			<div class="tags">
				<span class="tag status" style="border-color:{st.color}; color:{st.color}">
					<span class="sdot" style="background:{st.color}"></span>{st.label}
				</span>
				<span class="tag" style="border-color:{categoryColor(z)}; color:{categoryColor(z)}">
					{z.category}
				</span>
				{#if z.certainty}
					<span class="tag muted">{CERTAINTY_LABEL[z.certainty]}</span>
				{/if}
				{#if z.emissionType}
					<span class="tag muted">{EMISSION_LABEL[z.emissionType]}</span>
				{/if}
				{#if z.approx}
					<span class="tag muted">approximate location</span>
				{/if}
			</div>

			<h1>{z.name}</h1>
			<div class="coords">
				{z.lat.toFixed(2)}, {z.lng.toFixed(2)}
				<button class="compare-btn" onclick={() => addCompare(z.id)} disabled={ui.compare.includes(z.id)}>
					{ui.compare.includes(z.id) ? 'In comparison' : '+ Compare'}
				</button>
			</div>

			<p class="desc">{z.desc}</p>

			{#if z.health ?? HEALTH[z.id]}
				<div class="health"><span>Health effects</span> {z.health ?? HEALTH[z.id]}</div>
			{/if}

			<div class="ratings">
				<div><span>Health severity</span><b>{dots(severityOf(z))}</b></div>
				<div><span>Research depth</span><b>{dots(researchOf(z))}</b></div>
			</div>

			<div class="cite-head">Citations</div>
			<ul class="cites">
				{#each z.citations as c (c.url)}
					<li>
						<a href={c.url} target="_blank" rel="noopener noreferrer">{c.ref}</a>
						<span class="badge">{c.type}</span>
						{#if c.openAccess}<span class="badge open">open access</span>{/if}
						{#if c.doi}<span class="doi">doi:{c.doi}</span>{/if}
					</li>
				{/each}
			</ul>
		</div>
	</div>
{/if}

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
	.panel {
		position: relative;
		width: min(720px, 100%);
		max-height: 86vh;
		overflow-y: auto;
		background: rgba(10, 14, 23, 0.9);
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		padding: 28px 30px 30px;
		box-shadow: var(--shadow), inset 0 1px 0 rgba(255, 255, 255, 0.05);
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
	}
	.accent {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		border-radius: var(--radius) var(--radius) 0 0;
		opacity: 0.9;
	}
	.close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 30px;
		height: 30px;
	}
	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		margin-bottom: 12px;
	}
	.tag {
		font-size: 10.5px;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		padding: 3px 8px;
		border-radius: 999px;
		border: 1px solid var(--line);
	}
	.tag.muted {
		color: var(--muted);
	}
	.tag.status {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.sdot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
	}
	h1 {
		margin: 0;
		font-size: 24px;
		line-height: 1.2;
	}
	.coords {
		margin-top: 4px;
		font-size: 12px;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.compare-btn {
		font-size: 11px;
		color: var(--accent);
		background: var(--accent-soft);
		border: 1px solid var(--line);
		border-radius: 999px;
		padding: 3px 10px;
		cursor: pointer;
	}
	.compare-btn:disabled {
		color: var(--muted);
		background: transparent;
		cursor: default;
	}
	.desc {
		margin: 16px 0 22px;
		font-size: 15px;
		line-height: 1.65;
	}
	.health {
		margin: 0 0 16px;
		font-size: 13.5px;
		line-height: 1.55;
	}
	.health span {
		color: #ff9e80;
		font-weight: 600;
		margin-right: 6px;
	}
	.ratings {
		display: flex;
		gap: 24px;
		margin: 0 0 20px;
		font-size: 13px;
	}
	.ratings span {
		color: var(--muted);
		margin-right: 8px;
	}
	.ratings b {
		letter-spacing: 1px;
		color: #ccd6e6;
	}
	.cite-head {
		font-size: 11px;
		letter-spacing: 0.07em;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 8px;
	}
	.cites {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 9px;
	}
	.cites li {
		font-size: 13px;
		line-height: 1.4;
	}
	.badge {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		border: 1px solid var(--line);
		border-radius: 5px;
		padding: 1px 5px;
		margin-left: 6px;
	}
	.badge.open {
		color: #6fd99a;
		border-color: rgba(111, 217, 154, 0.4);
	}
	.doi {
		font-size: 11px;
		color: var(--muted);
		margin-left: 6px;
	}
</style>

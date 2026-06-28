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
			<div class="folder-tab">
				<span class="sdot" style="background:{st.color}"></span>
				<span>Exposure file</span>
				<span class="ref">№ {z.id}</span>
			</div>

			<div class="sheet">
				<button class="close icon-btn" bind:this={closeBtn} onclick={close} aria-label="Close">
					<Icon name="close" size={16} />
				</button>

				<header class="file-head">
					<h1>{z.name}</h1>
					<div class="coords">{z.lat.toFixed(2)}, {z.lng.toFixed(2)}</div>
				</header>

			<div class="rule"></div>

			<dl class="fields">
				<div class="field">
					<dt>Status</dt>
					<dd style="color:{st.color}">{st.label}</dd>
				</div>
				<div class="field">
					<dt>Category</dt>
					<dd style="color:{categoryColor(z)}">{z.category}</dd>
				</div>
				{#if z.certainty}
					<div class="field"><dt>Certainty</dt><dd>{CERTAINTY_LABEL[z.certainty]}</dd></div>
				{/if}
				{#if z.emissionType}
					<div class="field"><dt>Emission</dt><dd>{EMISSION_LABEL[z.emissionType]}</dd></div>
				{/if}
				{#if z.approx}
					<div class="field"><dt>Location</dt><dd>Approximate</dd></div>
				{/if}
			</dl>

			<div class="rule"></div>

			<p class="desc">{z.desc}</p>

			{#if z.health ?? HEALTH[z.id]}
				<section class="block">
					<span class="label">Health effects</span>
					<p>{z.health ?? HEALTH[z.id]}</p>
				</section>
			{/if}

			<div class="ratings">
				<div>
					<span class="label">Health severity</span>
					<b>{dots(severityOf(z))} <span class="num">{severityOf(z)}/5</span></b>
				</div>
				<div>
					<span class="label">Research depth</span>
					<b>{dots(researchOf(z))} <span class="num">{researchOf(z)}/5</span></b>
				</div>
			</div>

			<div class="rule"></div>

			<section class="block">
				<span class="label">Sources</span>
				<ul class="cites">
					{#each z.citations as c (c.url)}
						<li>
							<a href={c.url} target="_blank" rel="noopener noreferrer">{c.ref}</a>
							<div class="cite-meta">
								<span class="badge">{c.type}</span>
								{#if c.openAccess}<span class="badge open">open access</span>{/if}
								{#if c.doi}<span class="doi">doi:{c.doi}</span>{/if}
							</div>
						</li>
					{/each}
				</ul>
			</section>

			<button
				class="compare-btn"
				onclick={() => addCompare(z.id)}
				disabled={ui.compare.includes(z.id)}
			>
				{ui.compare.includes(z.id) ? '✓ In comparison' : '+ Add to comparison'}
				</button>
			</div>
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
		width: min(680px, 100%);
		display: flex;
		flex-direction: column;
	}
	.folder-tab {
		align-self: flex-start;
		margin-left: 30px;
		margin-bottom: -1px;
		z-index: 1;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 7px 18px 9px;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--muted);
		background: rgba(16, 22, 36, 0.97);
		border: 1px solid var(--line-strong);
		border-bottom: none;
		border-radius: 10px 10px 0 0;
		backdrop-filter: blur(var(--blur));
	}
	.folder-tab .ref {
		color: var(--faint);
		letter-spacing: 0.08em;
	}
	.sheet {
		position: relative;
		max-height: 84vh;
		overflow-y: auto;
		background: linear-gradient(180deg, rgba(13, 18, 30, 0.96), rgba(8, 11, 19, 0.96));
		border: 1px solid var(--line-strong);
		border-radius: var(--radius);
		padding: 24px 30px 28px;
		box-shadow: var(--shadow), inset 0 1px 0 rgba(255, 255, 255, 0.04);
		backdrop-filter: blur(var(--blur));
		-webkit-backdrop-filter: blur(var(--blur));
	}
	.close {
		position: absolute;
		top: 16px;
		right: 16px;
		width: 30px;
		height: 30px;
	}

	.file-head {
		padding-right: 36px;
	}
	.sdot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex: none;
	}
	h1 {
		margin: 6px 0 6px;
		font-family: var(--font-display);
		font-size: 26px;
		line-height: 1.18;
		letter-spacing: -0.01em;
	}
	.coords {
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 0.02em;
		color: var(--muted);
		font-variant-numeric: tabular-nums;
	}

	.rule {
		height: 1px;
		margin: 18px 0;
		background: linear-gradient(90deg, var(--divider), transparent 85%);
	}

	.fields {
		display: grid;
		grid-template-columns: max-content 1fr;
		column-gap: 22px;
		row-gap: 9px;
		margin: 0;
	}
	.field {
		display: contents;
	}
	.fields dt {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--faint);
		padding-top: 1px;
	}
	.fields dd {
		margin: 0;
		font-size: 13px;
		letter-spacing: 0.01em;
		color: var(--text);
	}

	.label {
		display: block;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 7px;
	}

	.desc {
		margin: 0 0 4px;
		font-size: 15px;
		line-height: 1.7;
		color: #e6ecf6;
	}
	.block {
		margin-top: 18px;
	}
	.block p {
		margin: 0;
		font-size: 13.5px;
		line-height: 1.6;
		color: var(--muted);
	}

	.ratings {
		display: flex;
		gap: 40px;
		margin-top: 18px;
	}
	.ratings b {
		display: block;
		margin-top: 3px;
		font-size: 14px;
		letter-spacing: 3px;
		color: var(--accent);
	}
	.ratings .num {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0;
		color: var(--muted);
		margin-left: 2px;
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
		line-height: 1.45;
	}
	.cite-meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-top: 5px;
	}
	.badge {
		font-family: var(--font-mono);
		font-size: 9.5px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		border: 1px solid var(--line);
		border-radius: 4px;
		padding: 1px 5px;
	}
	.badge.open {
		color: #7fd6a3;
		border-color: rgba(127, 214, 163, 0.4);
	}
	.doi {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--faint);
	}

	.compare-btn {
		margin-top: 22px;
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--accent);
		background: transparent;
		border: 1px solid var(--divider);
		border-radius: 7px;
		padding: 8px 14px;
		cursor: pointer;
		transition:
			border-color var(--dur) var(--ease),
			background var(--dur) var(--ease);
	}
	.compare-btn:hover:not(:disabled) {
		border-color: var(--accent);
		background: var(--accent-soft);
	}
	.compare-btn:disabled {
		color: var(--muted);
		cursor: default;
	}
	@media (max-width: 620px) {
		.backdrop {
			padding: 10px;
		}
		.folder-tab {
			margin-left: 14px;
		}
		.sheet {
			max-height: 90vh;
		}
	}
</style>

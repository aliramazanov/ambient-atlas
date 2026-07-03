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
	import Button from './Button.svelte';
	import Dialog from './Dialog.svelte';
	import Icon from './Icon.svelte';

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
</script>

{#if ui.selected}
	{@const z = ui.selected}
	{@const st = statusOf(z)}
	<Dialog onclose={close} label={z.name}>
		<div class="folder-tab">
			<span class="sdot" style="background:{st.color}"></span>
			<span>Exposure file</span>
			<span class="ref">{z.id}</span>
		</div>

		<div class="sheet">
			<Button variant="icon" size="icon" class="close" style="--btn-size:30px" onclick={close} aria-label="Close">
				<Icon name="close" size={16} />
			</Button>

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
					<dd style="color:{categoryColor(z)}">
					{z.category.charAt(0).toUpperCase() + z.category.slice(1)}
				</dd>
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

			<button class="compare-btn" onclick={() => addCompare(z.id)} disabled={ui.compare.includes(z.id)}>
				{ui.compare.includes(z.id) ? '✓ In comparison' : '+ Add to comparison'}
			</button>
		</div>
	</Dialog>
{/if}

<style>
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
		backdrop-filter: var(--glass-filter);
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
		backdrop-filter: var(--glass-filter);
		-webkit-backdrop-filter: var(--glass-filter);
	}
	.sheet::after {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		border-radius: inherit;
		opacity: 0.04;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
	}
	.sheet :global(.close) {
		position: absolute;
		top: 16px;
		right: 16px;
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
		font-weight: 600;
		font-size: 29px;
		line-height: 1.12;
		letter-spacing: -0.02em;
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
		.folder-tab {
			margin-left: 14px;
		}
		.sheet {
			max-height: 90vh;
		}
	}
</style>

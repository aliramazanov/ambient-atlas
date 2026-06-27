<script lang="ts">
	import { resolve } from '$app/paths';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import { cityData } from '$lib/data/generated/citydata';
	import { METRIC_BY_KEY } from '$lib/data/places/metrics';

	const SHOW_OPTIONS = [
		{ value: '25', label: 'Top 25' },
		{ value: '50', label: 'Top 50' },
		{ value: '100', label: 'Top 100' },
		{ value: 'all', label: 'Show all' }
	];

	const CONDS = [
		{ key: 'est', bit: 1, label: 'Established natural hazard' },
		{ key: 'man', bit: 16, label: 'Man-made disaster' },
		{ key: 'conflict', bit: 32, label: 'Active conflict' },
		{ key: 'uv', bit: 2, label: 'High ambient UV' },
		{ key: 'radon', bit: 4, label: 'Radon-prone terrain' },
		{ key: 'gray', bit: 8, label: 'Other open-question (gray)' },
		{ key: 'climate', bit: 64, label: 'Climate / environmental' }
	] as const;

	const WEIGHTS = [
		{ key: 'le', label: 'Life expectancy' },
		{ key: 'hdi', label: 'HDI' },
		{ key: 'income', label: 'Income' },
		{ key: 'safety', label: 'Safety (low homicide)' },
		{ key: 'equality', label: 'Equality (low Gini)' },
		{ key: 'climate', label: 'Climate comfort' }
	] as const;

	let dq = $state<Record<string, boolean>>({
		est: true,
		man: true,
		conflict: true,
		uv: false,
		radon: false,
		gray: false,
		climate: false
	});
	let w = $state<Record<string, number>>({ le: 1, hdi: 1, income: 1, safety: 1, equality: 1, climate: 1 });
	let limit = $state('25');

	const lifeDom = METRIC_BY_KEY.life?.domain;
	const hdiDom = METRIC_BY_KEY.hdi?.domain;
	const giniDom = METRIC_BY_KEY.gini?.domain;
	const homDom = METRIC_BY_KEY.homicide?.domain;
	const incDom = METRIC_BY_KEY.income
		? ([Math.log10(METRIC_BY_KEY.income.domain[0] || 1), Math.log10(METRIC_BY_KEY.income.domain[1] || 1)] as [number, number])
		: null;

	function norm(v: number | null, dom?: [number, number] | null) {
		if (v == null || !dom) return null;
		const [lo, hi] = dom;
		if (hi === lo) return 0.5;
		return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
	}

	function score(c: (typeof cityData)[number]) {
		const parts: [number, number][] = [];
		const le = norm(c.le, lifeDom);
		if (le != null) parts.push([le, w.le]);
		const hdi = norm(c.hdi, hdiDom);
		if (hdi != null) parts.push([hdi, w.hdi]);
		const inc = c.inc != null && incDom ? norm(Math.log10(c.inc), incDom) : null;
		if (inc != null) parts.push([inc, w.income]);
		const safe = c.hom != null ? 1 - (norm(c.hom, homDom) ?? 0) : null;
		if (safe != null) parts.push([safe, w.safety]);
		const eq = c.gini != null ? 1 - (norm(c.gini, giniDom) ?? 0) : null;
		if (eq != null) parts.push([eq, w.equality]);
		const cl = c.clim != null ? c.clim / 100 : null;
		if (cl != null) parts.push([cl, w.climate]);
		const ws = parts.reduce((a, [, x]) => a + x, 0);
		if (!ws) return 0;
		return Math.round((100 * parts.reduce((a, [v, x]) => a + v * x, 0)) / ws);
	}

	const disqualified = (f: number) => CONDS.some((c) => dq[c.key] && f & c.bit);
	const residual = (f: number) => CONDS.filter((c) => f & c.bit).map((c) => c.label);

	const rankedAll = $derived(
		cityData
			.filter((c) => !disqualified(c.f))
			.map((c) => ({ c, s: score(c), res: residual(c.f) }))
			.sort((a, b) => b.s - a.s)
	);

	const ranked = $derived(limit === 'all' ? rankedAll : rankedAll.slice(0, +limit));
	const passCount = $derived(rankedAll.length);

	function preset(name: string) {
		if (name === 'strict') dq = { est: true, man: true, conflict: true, uv: true, radon: true, gray: true, climate: true };
		else if (name === 'practical') dq = { est: true, man: true, conflict: true, uv: false, radon: false, gray: false, climate: false };
		else if (name === 'disasters') dq = { est: false, man: true, conflict: true, uv: false, radon: false, gray: false, climate: false };
	}
</script>

<svelte:head><title>Ambient Atlas: City rankings</title></svelte:head>

<main>
	<div class="wrap">
		<a class="back" href={resolve('/')}><Icon name="arrowLeft" size={14} /> Back to the globe</a>
		<h1>Build your own ranking</h1>
		<p class="lead">
			Choose which conditions disqualify a city and how to weight the social factors. Every city
			above 300,000 people is scored from its true distance to all mapped zones plus national
			indicators. Click a city to fly to it on the globe.
		</p>

		<div class="controls">
			<div class="panel">
				<div class="ctitle">Disqualify cities that have</div>
				{#each CONDS as cond (cond.key)}
					<label><input type="checkbox" bind:checked={dq[cond.key]} /> {cond.label}</label>
				{/each}
				<div class="presets">
					<button onclick={() => preset('practical')}>Practical</button>
					<button onclick={() => preset('strict')}>Strict</button>
					<button onclick={() => preset('disasters')}>Only war + disasters</button>
				</div>
			</div>
			<div class="panel">
				<div class="ctitle">Weight social factors</div>
				{#each WEIGHTS as wt (wt.key)}
					<label class="slider">
						<span>{wt.label}</span>
						<div class="weightslider">
							<Slider min={0} max={3} step={0.5} bind:value={w[wt.key]} label={wt.label} />
						</div>
						<i>{w[wt.key]}</i>
					</label>
				{/each}
			</div>
		</div>

		<div class="countbar">
			<p class="count">{passCount} cities pass your filters. Showing {ranked.length}.</p>
			<label class="show">
				<span>Show</span>
				<Select id="show" label="How many to show" bind:value={limit} options={SHOW_OPTIONS} />
			</label>
		</div>

		<table>
			<thead>
				<tr><th>#</th><th>City</th><th>Country</th><th>Score</th><th>Life exp.</th><th>Climate</th><th>Residual exposures</th></tr>
			</thead>
			<tbody>
				{#each ranked as r, i (r.c.name + r.c.country)}
					<tr>
						<td class="rank">{i + 1}</td>
						<td class="city"><a href="{resolve('/')}?fly={r.c.lat},{r.c.lng}">{r.c.name}</a></td>
						<td class="country">{r.c.country}</td>
						<td class="num"><span class="bar" style="--v:{r.s}%"></span>{r.s}</td>
						<td class="num">{r.c.le?.toFixed(1) ?? '-'}</td>
						<td class="num">{r.c.clim ?? '-'}{r.c.temp != null ? ` (${r.c.temp}°)` : ''}</td>
						<td class="res">{r.res.length ? r.res.join(', ') : 'none mapped'}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<p class="foot">
			Trust notes: a city shows "none mapped" only relative to what we have drawn, not absolute
			safety. The atlas maps chronic, ongoing ambient exposures, not historical acute events: the
			1945 atomic bombings, for example, are not mapped because Hiroshima's and Nagasaki's radiation
			returned to background levels long ago, so modern Hiroshima ranks on Japan's strong social
			indicators alone. Radon here is modeled regional terrain (a measured EPA/Health Canada/European
			upgrade is planned). Social scores are national, so they miss safe pockets inside lower-scoring
			countries. Set every condition on (Strict) and the list empties: no major city is clear of
			everything.
		</p>
	</div>
</main>

<style>
	main {
		position: fixed;
		inset: 0;
		overflow-y: auto;
		background: var(--bg);
	}
	.wrap {
		max-width: 920px;
		margin: 0 auto;
		padding: 36px 24px 80px;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		text-decoration: none;
	}
	h1 {
		font-size: 26px;
		margin: 16px 0 8px;
	}
	.lead {
		color: var(--muted);
		line-height: 1.6;
		font-size: 13.5px;
	}
	.controls {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		margin: 18px 0;
	}
	.panel {
		flex: 1;
		min-width: 280px;
		background: var(--panel);
		border: 1px solid var(--line);
		border-radius: 10px;
		padding: 14px 16px;
	}
	.ctitle {
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
		margin-bottom: 9px;
	}
	.panel label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 13px;
		padding: 3px 0;
	}
	.slider {
		justify-content: space-between;
	}
	.slider span {
		flex: 1;
	}
	.weightslider {
		flex: 1;
	}
	.slider i {
		width: 22px;
		text-align: right;
		color: var(--muted);
		font-style: normal;
	}
	.presets {
		margin-top: 10px;
		display: flex;
		gap: 6px;
		flex-wrap: wrap;
	}
	.presets button {
		font-size: 11px;
		color: var(--text);
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--line);
		border-radius: 6px;
		padding: 4px 8px;
		cursor: pointer;
	}
	.countbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
	}
	.count {
		font-size: 12.5px;
		color: var(--muted);
	}
	.show {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: var(--muted);
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	th,
	td {
		text-align: left;
		padding: 7px 10px;
		border-bottom: 1px solid var(--line);
		vertical-align: top;
	}
	thead th {
		position: sticky;
		top: 0;
		z-index: 2;
		background: var(--bg);
		font-size: 11px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}
	tbody tr:nth-child(even) {
		background: rgba(255, 255, 255, 0.025);
	}
	tbody tr:hover {
		background: var(--accent-soft);
	}
	.rank {
		color: var(--muted);
		width: 28px;
	}
	.city {
		font-weight: 600;
	}
	.city a {
		text-decoration: none;
	}
	.country {
		color: var(--muted);
	}
	.num {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
	.bar {
		display: inline-block;
		width: 40px;
		height: 6px;
		border-radius: 3px;
		margin-right: 8px;
		vertical-align: middle;
		background: linear-gradient(90deg, #2a788e var(--v), rgba(255, 255, 255, 0.08) var(--v));
	}
	.res {
		color: #c7b88f;
		font-size: 11.5px;
		max-width: 280px;
	}
	.foot {
		margin-top: 32px;
		color: var(--muted);
		font-size: 12.5px;
		line-height: 1.6;
		border-top: 1px solid var(--line);
		padding-top: 16px;
	}
</style>

<script lang="ts">
	import { resolve } from '$app/paths';
	import { zones } from '$lib/data/zones/zones';
	import Icon from '$lib/components/ui/Icon.svelte';

	const zoneCount = zones.length;
</script>

<svelte:head><title>Ambient Atlas: Sources & methodology</title></svelte:head>

<main>
	<div class="wrap">
		<a class="back" href={resolve('/')}><Icon name="arrowLeft" size={14} /> Back to the globe</a>
		<h1>Sources & methodology</h1>
		<p class="lead">
			Ambient Atlas maps {zoneCount} places where people live inside a chronic, largely unavoidable
			exposure, natural or man-made, plus climate and conflict hazards. Everything below is how it
			is built and where the numbers come from. It is illustrative and incomplete: absence of a
			marker is not proof of safety.
		</p>

		<section>
			<h2>Zone data</h2>
			<p>
				Each zone carries a description, a health-effects line, a certainty tag, a severity and
				research-depth rating, an estimated reach, and at least one citation. The zones are
				transcribed from a cited research dossier (in <code>research/</code>) drawing on IARC, WHO,
				UNSCEAR, ATSDR, USGS, peer-reviewed studies, and reputable agency reports. Per-zone
				citations are shown in the reader panel; open-access links are preferred.
			</p>
		</section>

		<section>
			<h2>Live and national data layers</h2>
			<ul>
				<li><b>Air quality</b> (live US AQI): <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo Air Quality API</a> (free, no key).</li>
				<li><b>Life expectancy</b>: <a href="https://data.worldbank.org/" target="_blank" rel="noopener noreferrer">World Bank</a> (national) and <a href="https://ec.europa.eu/eurostat" target="_blank" rel="noopener noreferrer">Eurostat NUTS-2</a> (sub-national, European cities).</li>
				<li><b>HDI</b>: <a href="https://hdr.undp.org/" target="_blank" rel="noopener noreferrer">UNDP Human Development Report</a>.</li>
				<li><b>Gini, income, homicide</b>: World Bank indicators.</li>
				<li><b>Climate comfort</b>: Open-Meteo historical climate (temperature, sunshine).</li>
				<li><b>Cities & countries</b>: <a href="https://github.com/lutangar/cities.json" target="_blank" rel="noopener noreferrer">all-the-cities</a>, world-countries, and world-atlas (Natural Earth) for borders.</li>
				<li><b>Conflicts</b>: illustrative, after the <a href="https://www.cfr.org/global-conflict-tracker" target="_blank" rel="noopener noreferrer">CFR Global Conflict Tracker</a>.</li>
			</ul>
		</section>

		<section>
			<h2>How the ratings are computed</h2>
			<ul>
				<li>
					<b>Reach</b>: an estimated real-world radius of impact in kilometres per zone, grounded
					where known and honest guesswork otherwise. It drives the displayed area and the hover
					hit-test (one value, so they always agree). A minimum is applied so small sites still
					render a readable glow.
				</li>
				<li>
					<b>Severity</b> (1-5): indicative health-impact severity, from the zone or a
					category/tier default.
				</li>
				<li>
					<b>Research depth</b> (1-5): how settled the health question is, derived from the
					certainty tag.
				</li>
				<li>
					<b>Calm-to-live score</b> (rankings): a normalized blend of life expectancy, HDI, income,
					low inequality and low homicide, minus a hazard penalty from nearby zones weighted by
					tier. It is centroid-based and coarse, a highlight, not a verdict.
				</li>
			</ul>
		</section>

		<section>
			<h2>Honest limits</h2>
			<ul>
				<li>Zone boundaries are approximate; reach is an estimate, not a survey.</li>
				<li>Society scores are national, so they miss safe pockets inside lower-scoring countries.</li>
				<li>Radon is currently modeled regional terrain, not measured EPA/JRC data.</li>
				<li>Gray zones are open questions, never claims of proven harm.</li>
				<li>The map is incomplete: a clear spot may simply lack a drawn zone.</li>
			</ul>
		</section>
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
		max-width: 820px;
		margin: 0 auto;
		padding: 40px 24px 80px;
	}
	.back {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13px;
		text-decoration: none;
	}
	h1 {
		font-size: 28px;
		margin: 18px 0 10px;
	}
	.lead {
		color: var(--muted);
		line-height: 1.65;
		font-size: 14px;
	}
	section {
		margin-top: 30px;
	}
	h2 {
		font-size: 18px;
		margin-bottom: 8px;
	}
	p,
	li {
		font-size: 13.5px;
		line-height: 1.65;
		color: var(--text);
	}
	ul {
		padding-left: 18px;
	}
	li {
		margin: 5px 0;
		color: var(--muted);
	}
	li b {
		color: var(--text);
	}
	code {
		background: rgba(255, 255, 255, 0.08);
		padding: 1px 5px;
		border-radius: 4px;
		font-size: 12px;
	}
</style>

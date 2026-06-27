<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { Vector3 } from 'three';
	import { cities, countryLabels } from '$lib/data/generated/places';
	import { cityLifeExpectancy } from '$lib/data/generated/city-life-expectancy';
	import { METRIC_BY_KEY, metricColor } from '$lib/data/places/metrics';
	import { latLngToVector3 } from '$lib/utils/geo';
	import { view } from '$lib/state/viewport.svelte';
	import { ui, flyToLocation } from '$lib/state/state.svelte';

	function openCountry(iso3: string | undefined, lat: number, lng: number) {
		if (!iso3) return;
		// Fly the globe toward the country first, then route, so the jump to its
		// page reads as a continuous zoom-in instead of an abrupt swap. Dist 1.8
		// frames the country without diving into the surface; the country page
		// fades and scales in on arrival to complete the handoff.
		flyToLocation(lat, lng, 1.8);
		setTimeout(() => goto(resolve('/country/[id]', { id: iso3 })), 600);
	}

	interface L {
		text: string;
		kind: 'country' | 'city';
		pos: Vector3;
		dir: Vector3;
		lat: number;
		lng: number;
		pop: number;
		significant: boolean;
		capital: boolean;
		sort: number;
		le: number | null;
		iso3?: string;
	}

	const labels: L[] = [];
	for (const c of countryLabels) {
		const pos = latLngToVector3(c.lat, c.lng, 1);
		labels.push({
			text: c.name,
			kind: 'country',
			pos,
			dir: pos.clone().normalize(),
			lat: c.lat,
			lng: c.lng,
			pop: 0,
			significant: false,
			capital: false,
			sort: 0, // countries claim cells last, as background context
			le: null,
			iso3: c.iso3
		});
	}
	for (const c of cities) {
		const pos = latLngToVector3(c.lat, c.lng, 1);
		labels.push({
			text: c.name,
			kind: 'city',
			pos,
			dir: pos.clone().normalize(),
			lat: c.lat,
			lng: c.lng,
			pop: c.pop,
			significant: !!c.significant,
			capital: !!c.capital,
			sort: c.significant ? 5e9 : c.capital ? 3e9 : 1e9 + c.pop,
			le: cityLifeExpectancy[`${c.lat.toFixed(3)},${c.lng.toFixed(3)}`] ?? null
		});
	}

	// Processing order for declutter: significant cities, big cities, then countries.
	const order = labels.map((_, i) => i).sort((a, b) => labels[b].sort - labels[a].sort);

	let els: HTMLDivElement[] = $state([]);
	const tmp = new Vector3();
	const camDir = new Vector3();

	function lerp(v: number, a: number, b: number, c: number, d: number) {
		const t = Math.max(0, Math.min(1, (v - a) / (b - a)));
		return c + (d - c) * t;
	}

	// Country and city labels show the active metric value and color when one is
	// selected. Cities use sub-national life expectancy for the 'life' metric;
	// otherwise only countries carry a value.
	function applyMetric(el: HTMLDivElement, l: L) {
		const key = ui.countryMetric;
		let value: number | undefined;
		if (key !== 'none') {
			if (l.kind === 'country' && l.iso3) value = METRIC_BY_KEY[key]?.map[l.iso3];
			else if (l.kind === 'city' && key === 'life') value = l.le ?? undefined;
		}
		const want = value != null ? `${key}:${value}` : '0';
		if (el.dataset.metric === want) return;
		el.dataset.metric = want;
		if (value != null) {
			const m = METRIC_BY_KEY[key];
			el.textContent = `${l.text} ${m.format(value)}`;
			// Filled pastel pill with dark text: the ramp reads as a clear scale this
			// way, where small pastel-colored text on the dark globe washed out.
			el.style.color = '#0b1320';
			el.style.background = metricColor(m, value);
			el.style.padding = '1px 7px';
			el.style.borderRadius = '999px';
			el.style.fontWeight = '700';
			el.style.textShadow = 'none';
			el.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.5)';
		} else {
			el.textContent = l.text;
			el.style.color = '';
			el.style.background = '';
			el.style.padding = '';
			el.style.borderRadius = '';
			el.style.fontWeight = '';
			el.style.textShadow = '';
			el.style.boxShadow = '';
		}
	}

	onMount(() => {
		let raf = 0;
		let last = 0;
		const tick = (now: number) => {
			raf = requestAnimationFrame(tick);
			if (now - last < 33) return; // throttle label projection to ~30fps
			last = now;
			// Hide all text while the reader is open (globe frozen) or while the camera
			// is moving (labels flicker around the cursor focus as the view shifts).
			if (ui.selected || view.moving) {
				for (const el of els) if (el) el.style.display = 'none';
				return;
			}
			const cam = view.camera;
			const w = view.width;
			const h = view.height;
			if (!cam || !w || !h) return;

			camDir.copy(cam.position).normalize();
			const dist = cam.position.length();
			// Closer camera reveals smaller cities; far view shows only the largest.
			const popThreshold = lerp(dist, 1.55, 3.6, 40e3, 5e6);
			// Reveal labels around where the user is pointing (or the center when idle).
			const fx = view.hasFocus ? view.focusX : w / 2;
			const fy = view.hasFocus ? view.focusY : h / 2;
			const focusR = Math.min(150, Math.max(90, Math.min(w, h) * 0.18));
			const occupied = new Set<string>();

			for (const i of order) {
				const l = labels[i];
				const el = els[i];
				if (!el) continue;

				const facing = l.dir.dot(camDir);
				let show = facing > 0.22;
				if (show && l.kind === 'city') {
					const eligible = l.significant || l.capital || l.pop >= popThreshold;
					if (!eligible) show = false;
				}

				if (show) {
					tmp.copy(l.pos).project(cam);
					if (tmp.z > 1 || tmp.x < -1 || tmp.x > 1 || tmp.y < -1 || tmp.y > 1) {
						show = false;
					} else {
						const x = (tmp.x * 0.5 + 0.5) * w;
						const y = (-tmp.y * 0.5 + 0.5) * h;
						const fd = Math.hypot(x - fx, y - fy);
						if (fd > focusR) {
							show = false;
						} else {
							const cell = `${Math.round(x / 76)},${Math.round(y / 24)}`;
							if (occupied.has(cell)) {
								show = false;
							} else {
								occupied.add(cell);
								applyMetric(el, l);
								const faceFade = Math.min(1, (facing - 0.22) / 0.28);
								const focusFade = Math.min(1, (1 - fd / focusR) * 1.6);
								el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
								el.style.opacity = String(Math.min(faceFade, focusFade));
								el.style.display = 'block';
							}
						}
					}
				}
				if (!show) el.style.display = 'none';
			}
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="labels">
	{#each labels as l, i (i)}
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			bind:this={els[i]}
			class="lbl {l.kind}"
			class:sig={l.significant}
			class:cap={l.capital}
			role={l.kind === 'country' && l.iso3 ? 'button' : undefined}
			tabindex={l.kind === 'country' && l.iso3 ? 0 : undefined}
			onclick={l.kind === 'country' && l.iso3 ? () => openCountry(l.iso3, l.lat, l.lng) : undefined}
			onkeydown={l.kind === 'country' && l.iso3
				? (e: KeyboardEvent) => {
						if (e.key === 'Enter' || e.key === ' ') openCountry(l.iso3, l.lat, l.lng);
					}
				: undefined}
		>
			{l.text}
		</div>
	{/each}
</div>

<style>
	.labels {
		position: absolute;
		inset: 0;
		z-index: 10;
		pointer-events: none;
		overflow: hidden;
	}
	.lbl {
		position: absolute;
		top: 0;
		left: 0;
		display: none;
		white-space: nowrap;
		transform-origin: center;
	}
	.city {
		font-size: 11.5px;
		font-weight: 500;
		color: #eef3fb;
		padding: 1px 6px;
		border-radius: 5px;
		background: rgba(6, 10, 16, 0.58);
		border: 1px solid rgba(255, 255, 255, 0.06);
	}
	.city.sig {
		color: #ffd9a8;
	}
	.city.cap::before {
		content: '';
		display: inline-block;
		width: 5px;
		height: 5px;
		margin-right: 5px;
		border-radius: 50%;
		background: #d9b46a;
		vertical-align: middle;
	}
	.country {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		pointer-events: auto;
		cursor: pointer;
		color: rgba(165, 185, 212, 0.7);
		text-shadow:
			0 0 5px rgba(0, 0, 0, 0.95),
			0 1px 2px rgba(0, 0, 0, 0.95);
	}
	.country:hover {
		color: #d9b46a;
	}
</style>

<script lang="ts">
	import { air, aqiColor, ensureAirData } from '$lib/state/air-quality.svelte';
	import { cities } from '$lib/data/generated/places';
	import { latLngToVector3 } from '$lib/utils/geo';
	import { ui } from '$lib/state/state.svelte';
	import { view } from '$lib/state/viewport.svelte';
	import { onMount } from 'svelte';
	import { Vector3 } from 'three';

	const pts = cities.map((c) => {
		const p = latLngToVector3(c.lat, c.lng, 1);
		return { pos: p, dir: p.clone().normalize() };
	});

	let els: HTMLDivElement[] = $state([]);
	const tmp = new Vector3();
	const camDir = new Vector3();

	// Fetch when the layer is first enabled.
	$effect(() => {
		if (ui.layers.airQuality) ensureAirData();
	});

	onMount(() => {
		let raf = 0;
		let last = 0;
		const tick = (now: number) => {
			raf = requestAnimationFrame(tick);
			if (now - last < 33) return; // throttle AQI projection to ~30fps
			last = now;
			const cam = view.camera;
			const w = view.width;
			const h = view.height;
			const on = ui.layers.airQuality && air.status === 'ready' && !ui.selected && !view.moving;
			if (!cam || !w || !h || !on) {
				for (const el of els) if (el) el.style.display = 'none';
				return;
			}
			camDir.copy(cam.position).normalize();
			// Reveal AQI only around the cursor focus, so it reads as a clean,
			// premium probe rather than a global confetti of dots.
			const fx = view.hasFocus ? view.focusX : w / 2;
			const fy = view.hasFocus ? view.focusY : h / 2;
			// Zoomed in, cities are sparse on screen, so show all visible AQI; zoomed
			// out, gate to the cursor so it stays a clean local probe.
			const dist = cam.position.length();
			const focusR = dist < 1.9 ? Infinity : Math.min(165, Math.max(110, Math.min(w, h) * 0.18));
			const occupied = new Set<string>();
			for (let i = 0; i < pts.length; i++) {
				const el = els[i];
				const v = air.aqi[i];
				if (!el) continue;
				if (v == null || pts[i].dir.dot(camDir) < 0.25) {
					el.style.display = 'none';
					continue;
				}
				tmp.copy(pts[i].pos).project(cam);
				if (tmp.z > 1 || tmp.x < -1 || tmp.x > 1 || tmp.y < -1 || tmp.y > 1) {
					el.style.display = 'none';
					continue;
				}
				const x = (tmp.x * 0.5 + 0.5) * w;
				const y = (-tmp.y * 0.5 + 0.5) * h;
				const fd = Math.hypot(x - fx, y - fy);
				if (fd > focusR) {
					el.style.display = 'none';
					continue;
				}
				// Declutter: at most one pill per screen cell so numbers stay legible.
				const cell = `${Math.round(x / 46)},${Math.round(y / 22)}`;
				if (occupied.has(cell)) {
					el.style.display = 'none';
					continue;
				}
				occupied.add(cell);
				const col = aqiColor(v);
				el.textContent = `${Math.round(v)}`;
				// Sit just above the city point so it stays near the label, not on top of it.
				el.style.transform = `translate(${x}px, ${y - 15}px) translate(-50%, -50%)`;
				el.style.background = col;
				el.style.opacity = String(Math.min(1, (1 - fd / focusR) * 1.8));
				el.style.display = 'block';
			}
		};
		raf = requestAnimationFrame(tick);
		return () => cancelAnimationFrame(raf);
	});
</script>

<div class="aq">
	{#each pts as _p, i (i)}
		<div bind:this={els[i]} class="dot"></div>
	{/each}
</div>

<style>
	.aq {
		position: absolute;
		inset: 0;
		z-index: 9;
		pointer-events: none;
		overflow: hidden;
	}
	.dot {
		position: absolute;
		top: 0;
		left: 0;
		display: none;
		padding: 1px 6px;
		font-size: 10px;
		font-weight: 700;
		line-height: 1.5;
		color: #0b1320;
		border-radius: 999px;
		border: 1px solid rgba(0, 0, 0, 0.3);
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
		box-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
	}
</style>

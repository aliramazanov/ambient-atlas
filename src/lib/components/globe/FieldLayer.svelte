<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import {
		AdditiveBlending,
		BufferGeometry,
		CanvasTexture,
		Color,
		Float32BufferAttribute,
		Group,
		Material,
		Mesh,
		MeshBasicMaterial,
		SphereGeometry,
		SRGBColorSpace,
		Vector3
	} from 'three';
	import { zones } from '$lib/data/zones/zones';
	import { zoneRadiusDeg } from '$lib/data/scales/reach';
	import { categoryColor, certaintyOpacity, anthroSubOf } from '$lib/data/scales/categories';
	import { latLngToVector3 } from '$lib/utils/geo';
	import { clipFor } from '$lib/interaction/conflict-clip';
	import { ui } from '$lib/state/state.svelte';
	import { view } from '$lib/state/viewport.svelte';
	import type { Tier } from '$lib/data/zones/types';

	// Reach glows are context at globe scale; up close they become huge flat discs
	// that swamp the surface, so fade them out as the camera nears the surface.
	function zoomFade(d: number): number {
		const c = Math.max(0, Math.min(1, (d - 1.15) / (2.2 - 1.15)));
		return 0.05 + 0.95 * (c * c * (3 - 2 * c));
	}

	// Dots scale super-linearly with camera distance: clearly bigger and findable
	// when zoomed out, smaller as you move in so they never balloon into blobs.
	function dotZoom(d: number): number {
		return Math.max(0.4, Math.min(3.4, Math.pow(d / 3.0, 1.4)));
	}

	const DEG2RAD = Math.PI / 180;
	const FILL_R = 1.002;
	const EDGE_R = 1.0035;
	const DOT_R = 1.006;

	const gradient = makeRadialTexture();
	const group = new Group();
	const disposables: { dispose(): void }[] = [gradient];

	interface Entry {
		id: string;
		tier: Tier;
		category: string;
		sub: string;
		fades: { mat: Material & { opacity: number }; base: number; kind: 'fill' | 'ring' }[];
		certainty: number;
		areaNodes: { visible: boolean }[];
		dot: Mesh;
	}
	const entries: Entry[] = [];

	const ordered = zones
		.map((z, i) => ({ z, i }))
		.sort((a, b) => zoneRadiusDeg(b.z) - zoneRadiusDeg(a.z));

	for (const { z } of ordered) {
		const color = new Color(categoryColor(z));
		const center = latLngToVector3(z.lat, z.lng, 1).normalize();
		const radiusRad = zoneRadiusDeg(z) * DEG2RAD;
		const { u, v } = basis(center);
		const clip = clipFor(z.id);
		const areaNodes: { visible: boolean }[] = [];
		const fades: Entry['fades'] = [];

		// Glowing filled area (additive gradient cap), shown on hover/pin/show-all.
		// Kept moderate so the hue-carrying boundary ring and dot stay readable
		// where many fields overlap (additive fills sum toward white).
		const fillBase = clip ? 0.4 : 0.45;
		const capGeo = buildCap(center, u, v, radiusRad, FILL_R, clip ? 36 : 24, clip ? 72 : 96, clip);
		const capMat = new MeshBasicMaterial({
			map: gradient,
			color,
			transparent: true,
			opacity: fillBase,
			depthWrite: false,
			blending: AdditiveBlending
		});
		const cap = new Mesh(capGeo, capMat);
		cap.renderOrder = 2;
		group.add(cap);
		areaNodes.push(cap);
		fades.push({ mat: capMat, base: fillBase, kind: 'fill' });
		disposables.push(capGeo, capMat);

		// Defined boundary ring at the reach (skip for clipped conflict; its edge is the border).
		if (!clip) {
			const halfW = Math.min(0.6 * DEG2RAD, Math.max(0.08 * DEG2RAD, radiusRad * 0.03));
			const edgeGeo = buildBand(center, u, v, radiusRad, halfW, EDGE_R, 128);
			const edgeMat = new MeshBasicMaterial({
				color,
				transparent: true,
				opacity: 0.85,
				depthWrite: false
			});
			const edge = new Mesh(edgeGeo, edgeMat);
			edge.renderOrder = 4;
			group.add(edge);
			areaNodes.push(edge);
			fades.push({ mat: edgeMat, base: 0.85, kind: 'ring' });
			disposables.push(edgeGeo, edgeMat);
		}

		// Epicenter dot.
		const dotGeo = new SphereGeometry(0.0016, 24, 24);
		const dotMat = new MeshBasicMaterial({ color: color.clone().lerp(new Color('#ffffff'), 0.2) });
		const dot = new Mesh(dotGeo, dotMat);
		dot.position.copy(center.clone().multiplyScalar(DOT_R));
		dot.renderOrder = 10;
		group.add(dot);
		disposables.push(dotGeo, dotMat);

		entries.push({
			id: z.id,
			tier: z.tier,
			category: z.category,
			sub: z.tier === 'anthropogenic' ? anthroSubOf(z) : '',
			fades,
			certainty: certaintyOpacity(z.certainty),
			areaNodes,
			dot
		});
	}

	// Visibility by tier; opacity by intensity, certainty, and hover focus (hovered
	// zone brightens, the rest fade) to keep the map uncluttered at rest.
	// Dots always show (by tier). The reach area shows only on hover, when pinned,
	// or when "show all areas" is on.
	$effect(() => {
		const showAll = ui.showAllAreas;
		const hoveredId = ui.hovered?.id ?? null;
		const intensity = ui.fieldIntensity;
		const moving = view.moving;
		const fillFade = zoomFade(view.dist);
		const ringFade = 0.55 + 0.45 * fillFade; // rings stay legible up close
		const dz = dotZoom(view.dist);
		for (const e of entries) {
			const on =
				ui.tiers[e.tier] &&
				(e.tier !== 'established' || ui.cats[e.category]) &&
				(e.tier !== 'anthropogenic' || ui.cats[e.sub]);
			const pinned = ui.pinned[e.id];
			// While the camera moves, hide everything except reach glows (show-all or
			// pinned); dots and hover effects are suppressed for a clean spin.
			e.dot.visible = on && !moving;
			if (on) e.dot.scale.setScalar(dz * (hoveredId === e.id ? 1.9 : pinned ? 1.3 : 1));
			const showArea = on && (showAll || pinned || (!moving && hoveredId === e.id));
			for (const n of e.areaNodes) n.visible = showArea;
			if (!showArea) continue;
			const f = intensity * Math.max(0.7, e.certainty) * (hoveredId === e.id ? 1.5 : 1);
			for (const fd of e.fades) {
				// Pinned zones resist the zoom fade (deliberately kept); rings persist
				// up close while the muddy fill fades out.
				const zf = pinned ? 1 : fd.kind === 'ring' ? ringFade : fillFade;
				fd.mat.opacity = Math.min(0.92, fd.base * f * zf);
			}
		}
	});

	// Gentle "breathing" pulse on the hovered zone for a premium, alive feel.
	let pulseT = 0;
	useTask((delta) => {
		const id = ui.hovered?.id;
		if (!id) return;
		const e = entries.find((x) => x.id === id);
		if (!e || !ui.tiers[e.tier]) return;
		pulseT += delta;
		const pinned = ui.pinned[e.id];
		const fillFade = zoomFade(view.dist);
		const ringFade = 0.55 + 0.45 * fillFade;
		const f = ui.fieldIntensity * Math.max(0.7, e.certainty) * (1.4 + 0.2 * Math.sin(pulseT * 5));
		for (const fd of e.fades) {
			const zf = pinned ? 1 : fd.kind === 'ring' ? ringFade : fillFade;
			fd.mat.opacity = Math.min(0.95, fd.base * f * zf);
		}
	});

	onDestroy(() => {
		for (const d of disposables) d.dispose();
	});

	function basis(center: Vector3): { u: Vector3; v: Vector3 } {
		const ref = Math.abs(center.y) < 0.99 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0);
		const u = new Vector3().crossVectors(ref, center).normalize();
		const v = new Vector3().crossVectors(center, u).normalize();
		return { u, v };
	}

	function capPoint(center: Vector3, u: Vector3, v: Vector3, a: number, t: number, radius: number) {
		const sinA = Math.sin(a);
		const x = center.x * Math.cos(a) + (u.x * Math.cos(t) + v.x * Math.sin(t)) * sinA;
		const y = center.y * Math.cos(a) + (u.y * Math.cos(t) + v.y * Math.sin(t)) * sinA;
		const z = center.z * Math.cos(a) + (u.z * Math.cos(t) + v.z * Math.sin(t)) * sinA;
		return [x * radius, y * radius, z * radius] as const;
	}

	function ptLatLng(x: number, y: number, z: number): [number, number] {
		const r = Math.hypot(x, y, z) || 1;
		const lat = 90 - (Math.acos(Math.max(-1, Math.min(1, y / r))) * 180) / Math.PI;
		let lng = (Math.atan2(z, -x) * 180) / Math.PI - 180;
		while (lng < -180) lng += 360;
		while (lng > 180) lng -= 360;
		return [lat, lng];
	}

	/** A filled ring band (annulus) between aMid-halfW and aMid+halfW. */
	function buildBand(
		center: Vector3,
		u: Vector3,
		v: Vector3,
		aMid: number,
		halfW: number,
		radius: number,
		spokes: number
	): BufferGeometry {
		const inner = Math.max(0, aMid - halfW);
		const outer = aMid + halfW;
		const pos: number[] = [];
		const idx: number[] = [];
		for (let j = 0; j <= spokes; j++) {
			const t = (j / spokes) * Math.PI * 2;
			const pi = capPoint(center, u, v, inner, t, radius);
			const po = capPoint(center, u, v, outer, t, radius);
			pos.push(pi[0], pi[1], pi[2], po[0], po[1], po[2]);
		}
		for (let j = 0; j < spokes; j++) {
			const a0 = j * 2;
			const a1 = j * 2 + 1;
			const b0 = (j + 1) * 2;
			const b1 = (j + 1) * 2 + 1;
			idx.push(a0, b0, b1, a0, b1, a1);
		}
		const g = new BufferGeometry();
		g.setAttribute('position', new Float32BufferAttribute(pos, 3));
		g.setIndex(idx);
		return g;
	}

	function buildCap(
		center: Vector3,
		u: Vector3,
		v: Vector3,
		radiusRad: number,
		radius: number,
		rings: number,
		spokes: number,
		clip: ((lat: number, lng: number) => boolean) | null
	): BufferGeometry {
		const pos: number[] = [];
		const uv: number[] = [];
		const idx: number[] = [];
		for (let i = 0; i <= rings; i++) {
			const a = (i / rings) * radiusRad;
			const ur = (i / rings) * 0.5;
			for (let j = 0; j <= spokes; j++) {
				const t = (j / spokes) * Math.PI * 2;
				const [x, y, z] = capPoint(center, u, v, a, t, radius);
				pos.push(x, y, z);
				uv.push(0.5 + ur * Math.cos(t), 0.5 + ur * Math.sin(t));
			}
		}
		const tri = (p: number, q: number, r2: number) => {
			if (clip) {
				const cx = (pos[p * 3] + pos[q * 3] + pos[r2 * 3]) / 3;
				const cy = (pos[p * 3 + 1] + pos[q * 3 + 1] + pos[r2 * 3 + 1]) / 3;
				const cz = (pos[p * 3 + 2] + pos[q * 3 + 2] + pos[r2 * 3 + 2]) / 3;
				const [la, lo] = ptLatLng(cx, cy, cz);
				if (!clip(la, lo)) return;
			}
			idx.push(p, q, r2);
		};
		const stride = spokes + 1;
		for (let i = 0; i < rings; i++) {
			for (let j = 0; j < spokes; j++) {
				const a0 = i * stride + j;
				const a1 = a0 + 1;
				const b0 = (i + 1) * stride + j;
				const b1 = b0 + 1;
				tri(a0, b0, b1);
				tri(a0, b1, a1);
			}
		}
		const g = new BufferGeometry();
		g.setAttribute('position', new Float32BufferAttribute(pos, 3));
		g.setAttribute('uv', new Float32BufferAttribute(uv, 2));
		g.setIndex(idx);
		return g;
	}

	function makeRadialTexture(): CanvasTexture {
		const size = 256;
		const c = document.createElement('canvas');
		c.width = c.height = size;
		const ctx = c.getContext('2d')!;
		const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
		g.addColorStop(0, 'rgba(255,255,255,1)');
		g.addColorStop(0.45, 'rgba(255,255,255,0.5)');
		g.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = g;
		ctx.fillRect(0, 0, size, size);
		const tex = new CanvasTexture(c);
		tex.colorSpace = SRGBColorSpace;
		return tex;
	}
</script>

<T is={group} />

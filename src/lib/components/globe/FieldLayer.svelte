<script lang="ts">
	import { anthroSubOf, categoryColor, certaintyOpacity } from '$lib/data/scales/categories';
	import { zoneRadiusDeg } from '$lib/data/scales/reach';
	import type { Tier, Zone } from '$lib/data/zones/types';
	import { zones } from '$lib/data/zones/zones';
	import { clipFor } from '$lib/interaction/conflict-clip';
	import { ui } from '$lib/state/state.svelte';
	import { view } from '$lib/state/viewport.svelte';
	import { latLngToVector3 } from '$lib/utils/geo';
	import { T, useTask } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import {
	  BufferGeometry,
	  CanvasTexture,
	  Color,
	  Float32BufferAttribute,
	  Group,
	  Material,
	  Mesh,
	  MeshBasicMaterial,
	  PerspectiveCamera,
	  Sprite,
	  SpriteMaterial,
	  SRGBColorSpace,
	  Vector3
	} from 'three';

	function zoomFade(d: number): number {
		const c = Math.max(0, Math.min(1, (d - 1.15) / (2.2 - 1.15)));
		return 0.05 + 0.95 * (c * c * (3 - 2 * c));
	}


	function dotZoom(d: number): number {
		return Math.max(0.4, Math.min(3.4, Math.pow(d / 3.0, 1.4)));
	}

	const DEG2RAD = Math.PI / 180;
	const FILL_R = 1.002;
	const EDGE_R = 1.0035;
	const DOT_R = 1.006;
	const DOT_SIZE = 0.0064; // sprite world size for the epicenter ball (before zoom)

	const gradient = makeRadialTexture();
	const ballTex = makeBallTexture();
	const group = new Group();
	const disposables: { dispose(): void }[] = [gradient, ballTex];
	const WHITE = new Color('#ffffff');

	interface Entry {
		id: string;
		tier: Tier;
		category: string;
		sub: string;
		fades: { mat: Material & { opacity: number }; base: number; kind: 'fill' | 'ring' }[];
		certainty: number;
		areaNodes: Mesh[];
		center: Vector3;
		dotBase: Vector3;
		dot: Sprite;
		z: Zone;
		sx: number;
		sy: number;
		sr: number;
		reachRad: number;
		reachScreenR: number;
		areaScale: number;
		onScreen: boolean;
		glow: number;
		baseColor: Color;
		pinAnim: boolean;
	}

	const entries: Entry[] = [];

	const ordered = zones
		.map((z, i) => ({ z, i }))
		.sort((a, b) => zoneRadiusDeg(b.z) - zoneRadiusDeg(a.z));

	for (const { z } of ordered) {
		const color = new Color(categoryColor(z));

		const center = latLngToVector3(z.lat, z.lng, 1).normalize();
		const radiusDeg = zoneRadiusDeg(z);
		const radiusRad = radiusDeg * DEG2RAD;
		const areaScale = Math.max(0.4, Math.min(1, 14 / radiusDeg));

		const { u, v } = basis(center);

		const clip = clipFor(z.id);

		const areaNodes: Mesh[] = [];
		const fades: Entry['fades'] = [];


		const fillBase = clip ? 0.4 : 0.45;

		const capGeo = buildCap(center, u, v, radiusRad, FILL_R, clip ? 22 : 10, clip ? 52 : 44, clip);
		const capMat = new MeshBasicMaterial({
			map: gradient,
			color,
			transparent: true,
			opacity: fillBase,
			depthWrite: false
		});
		const cap = new Mesh(capGeo, capMat);
		cap.renderOrder = 2;

		group.add(cap);
		areaNodes.push(cap);
		fades.push({ mat: capMat, base: fillBase, kind: 'fill' });
		disposables.push(capGeo, capMat);

		if (!clip) {
			const halfW = Math.min(0.6 * DEG2RAD, Math.max(0.08 * DEG2RAD, radiusRad * 0.03));
			const edgeGeo = buildBand(center, u, v, radiusRad, halfW, EDGE_R, 80);
			const edgeMat = new MeshBasicMaterial({
				color,
				transparent: true,
				opacity: 0.6,
				depthWrite: false
			});
			const edge = new Mesh(edgeGeo, edgeMat);
			edge.renderOrder = 4;
			group.add(edge);
			areaNodes.push(edge);
			fades.push({ mat: edgeMat, base: 0.6, kind: 'ring' });
			disposables.push(edgeGeo, edgeMat);
		}

		const tint = color.clone().lerp(WHITE, 0.12).getHexString();

		const baseColor = new Color(`#${tint}`);
		const dotMat = new SpriteMaterial({
			map: ballTex,
			color: baseColor.clone(),
			transparent: true,
			depthWrite: false
		});
		disposables.push(dotMat);

		const dotBase = center.clone().multiplyScalar(DOT_R);
		const dot = new Sprite(dotMat);

		dot.position.copy(dotBase);
		dot.scale.setScalar(DOT_SIZE);
		dot.renderOrder = 10;
		group.add(dot);

		entries.push({
			id: z.id,
			tier: z.tier,
			category: z.category,
			sub: z.tier === 'anthropogenic' ? anthroSubOf(z) : '',
			fades,
			certainty: certaintyOpacity(z.certainty),
			areaNodes,
			center,
			dotBase,
			dot,
			z,
			sx: 0,
			sy: 0,
			sr: 0,
			reachRad: radiusRad,
			reachScreenR: 0,
			areaScale,
			onScreen: false,
			glow: 0,
			baseColor,
			pinAnim: false
		});
	}



	const rRight = new Vector3();
	const rUp = new Vector3();
	const rDir = new Vector3();
	const rProj = new Vector3();
	const rOff = new Vector3();

	function visibleNow(e: Entry): boolean {
		return (
			ui.tiers[e.tier] &&
			(e.tier !== 'established' || ui.cats[e.category]) &&
			(e.tier !== 'anthropogenic' || ui.cats[e.sub])
		);
	}

	function relaxMarkers() {
		const cam = view.camera as PerspectiveCamera | null;
		const w = view.width;
		const h = view.height;
		if (!cam || !w || !h) return;

		rDir.copy(cam.position).normalize();
		rRight.setFromMatrixColumn(cam.matrixWorld, 0).normalize();
		rUp.setFromMatrixColumn(cam.matrixWorld, 1).normalize();
		const fovTan = Math.tan((cam.fov * Math.PI) / 360);

		const ballR = (DOT_SIZE * dotZoom(view.dist)) / 2;
		type P = { e: Entry; tx: number; ty: number; x: number; y: number; sr: number; wpp: number };
		const pts: P[] = [];

		for (const e of entries) {
			for (const m of e.areaNodes) m.position.set(0, 0, 0);
			e.dot.position.copy(e.dotBase);
			e.onScreen = false;
			if (!visibleNow(e)) continue;
			if (e.center.dot(rDir) < 0.12) continue;
			rProj.copy(e.center).project(cam);
			if (rProj.z > 1) continue;
			const x = (rProj.x * 0.5 + 0.5) * w;
			const y = (-rProj.y * 0.5 + 0.5) * h;
			const dist = cam.position.distanceTo(e.center);
			const wpp = (2 * dist * fovTan) / h;
			pts.push({ e, tx: x, ty: y, x, y, sr: ballR / wpp, wpp });
		}

		for (let iter = 0; iter < 30; iter++) {
			for (let i = 0; i < pts.length; i++) {
				for (let j = i + 1; j < pts.length; j++) {
					let dx = pts[j].x - pts[i].x;
					let dy = pts[j].y - pts[i].y;
					let d = Math.hypot(dx, dy);

					if (d < 0.001) {
						dx = (j % 2 ? 0.5 : -0.5);
						dy = 0.5;
						d = Math.hypot(dx, dy);
					}

					const min = (pts[i].sr + pts[j].sr) * 1.18;

					if (d < min) {
						const push = (min - d) / 2;
						pts[i].x -= (dx / d) * push;
						pts[i].y -= (dy / d) * push;
						pts[j].x += (dx / d) * push;
						pts[j].y += (dy / d) * push;
					}
				}
			}
			for (const p of pts) {
				p.x += (p.tx - p.x) * 0.04;
				p.y += (p.ty - p.y) * 0.04;
				const ox = p.x - p.tx;
				const oy = p.y - p.ty;
				const od = Math.hypot(ox, oy);
				const cap = p.sr * 3;
				if (od > cap) {
					p.x = p.tx + (ox / od) * cap;
					p.y = p.ty + (oy / od) * cap;
				}
			}
		}

		for (const p of pts) {
			p.e.sx = p.x;
			p.e.sy = p.y;
			p.e.sr = p.sr;
			p.e.reachScreenR = p.e.reachRad / p.wpp;
			p.e.onScreen = true;

			const offX = p.x - p.tx;
			const offY = p.y - p.ty;

			if (Math.abs(offX) < 0.5 && Math.abs(offY) < 0.5) continue;
			rOff.copy(rRight).multiplyScalar(offX * p.wpp).addScaledVector(rUp, -offY * p.wpp);

			for (const m of p.e.areaNodes) m.position.copy(rOff);
			p.e.dot.position.copy(p.e.dotBase).add(rOff);
		}
	}

	useTask(() => {
		if (view.coarse) return;
		if (view.moving || !view.hasFocus || view.overUI) {
			if (ui.hovered) ui.hovered = null;
			return;
		}

		const fx = view.focusX;
		const fy = view.focusY;
		let best: Entry | null = null;
		let bestD = Infinity;

		for (const e of entries) {
			if (!e.onScreen) continue;
			const d = Math.hypot(e.sx - fx, e.sy - fy);
			const hit = Math.max(18, Math.min(e.reachScreenR * 0.4, 60));
			if (d <= hit && d < bestD) {
				bestD = d;
				best = e;
			}
		}

		const id = best?.id ?? null;

		if ((ui.hovered?.id ?? null) !== id) ui.hovered = best ? best.z : null;
	});

	let needsRelax = true;

	useTask(() => {
		if (view.moving) {
			needsRelax = true;
			return;
		}
		if (!needsRelax) return;
		needsRelax = false;
		relaxMarkers();
	});
	$effect(() => {
		for (const x of Object.values(ui.tiers)) void x;
		for (const x of Object.values(ui.cats)) void x;
		needsRelax = true;
	});

	$effect(() => {
		const moving = view.moving;
		const dz = dotZoom(view.dist);
		for (const e of entries) {
			const on = visibleNow(e);
			e.dot.visible = on && !moving;
			if (on) e.dot.scale.setScalar(DOT_SIZE * dz * (ui.pinned[e.id] ? 1.2 : 1));
		}
	});

	let pulseT = 0;

	useTask((delta) => {
		pulseT += delta;
		const showAll = ui.showAllAreas;
		const hoveredId = ui.hovered?.id ?? null;
		const intensity = ui.fieldIntensity;
		const moving = view.moving;
		const dz = dotZoom(view.dist);
		const fillFade = zoomFade(view.dist);
		const ringFade = 0.55 + 0.45 * fillFade;

		for (const e of entries) {
			const pinned = ui.pinned[e.id];

			if (pinned) {
				const s = 0.5 + 0.5 * Math.sin(pulseT * 3.2);
				e.dot.scale.setScalar(DOT_SIZE * dz * 1.2 * (0.94 + 0.12 * s));
				e.dot.material.color.copy(e.baseColor).lerp(WHITE, 0.08 + 0.14 * s);
				e.pinAnim = true;
			} else if (e.pinAnim) {
				e.dot.scale.setScalar(DOT_SIZE * dz);
				e.dot.material.color.copy(e.baseColor);
				e.pinAnim = false;
			}

			const wantsArea =
				visibleNow(e) && (showAll || pinned || (!moving && hoveredId === e.id));

			const rate = wantsArea ? 2.4 : 5;
			e.glow += ((wantsArea ? 1 : 0) - e.glow) * Math.min(1, delta * rate);

			const show = e.glow > 0.008;
			for (const n of e.areaNodes) n.visible = show;
			if (!show) continue;

			const hov = hoveredId === e.id;
			const pulse = hov ? 1.06 + 0.08 * Math.sin(pulseT * 4) : 1;
			const f = intensity * Math.max(0.7, e.certainty) * pulse * e.areaScale;
			for (const fd of e.fades) {
				const zf = pinned ? 1 : fd.kind === 'ring' ? ringFade : fillFade;
				fd.mat.opacity = Math.min(0.8, fd.base * f * zf) * e.glow;
			}
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

	function makeBallTexture(): CanvasTexture {
		const size = 128;
		const c = document.createElement('canvas');
		c.width = c.height = size;
		const ctx = c.getContext('2d')!;
		const g = ctx.createRadialGradient(
			size * 0.36,
			size * 0.32,
			size * 0.04,
			size * 0.5,
			size * 0.5,
			size * 0.5
		);
		g.addColorStop(0, '#ffffff');
		g.addColorStop(0.45, '#d7d7d7');
		g.addColorStop(0.82, '#6f6f6f');
		g.addColorStop(1, '#383838');
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
		ctx.fill();
		const tex = new CanvasTexture(c);
		tex.colorSpace = SRGBColorSpace;
		return tex;
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

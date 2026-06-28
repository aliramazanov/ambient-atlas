<script lang="ts">
	import { zoneAtPoint } from '$lib/interaction/picking';
	import { flyToLocation, openZone, togglePin, ui } from '$lib/state/state.svelte';
	import { view } from '$lib/state/viewport.svelte';
	import { latLngToVector3, vector3ToLatLng } from '$lib/utils/geo';
	import { isLand } from '$lib/utils/land-mask';
	import { T, useTask, useThrelte } from '@threlte/core';
	import { OrbitControls, interactivity } from '@threlte/extras';
	import { geoGraticule10 } from 'd3-geo';
	import { onDestroy, onMount } from 'svelte';
	import {
	  AdditiveBlending,
	  BackSide,
	  BufferAttribute,
	  BufferGeometry,
	  CanvasTexture,
	  Color,
	  Float32BufferAttribute,
	  Group,
	  LineBasicMaterial,
	  LineSegments,
	  Mesh,
	  MeshStandardMaterial,
	  Points,
	  PointsMaterial,
	  SphereGeometry,
	  SRGBColorSpace,
	  Vector3
	} from 'three';
	import type { OrbitControls as OrbitControlsRef } from 'three/examples/jsm/controls/OrbitControls.js';


	let Coastlines = $state<typeof import('./Coastlines.svelte').default | null>(null);
	let DottedEarth = $state<typeof import('./DottedEarth.svelte').default | null>(null);
	let FieldLayer = $state<typeof import('./FieldLayer.svelte').default | null>(null);

		onMount(() => {
		requestAnimationFrame(() =>
			requestAnimationFrame(async () => {
				const [c, d, f] = await Promise.all([
					import('./Coastlines.svelte'),
					import('./DottedEarth.svelte'),
					import('./FieldLayer.svelte')
				]);
				Coastlines = c.default;
				DottedEarth = d.default;
				FieldLayer = f.default;
			})
		);
	});

	interactivity();

	const { camera, size } = useThrelte();
	let controls = $state<OrbitControlsRef | undefined>(undefined);


	onMount(() => {
		const onWheel = (e: WheelEvent) => {
			if (!controls) return;
			const cam = camera.current;
			const d = cam ? cam.position.length() : 3;
			const near = Math.max(0, Math.min(1, (d - 1.1) / (4 - 1.1)));
			controls.zoomSpeed = e.deltaY > 0 ? 1.15 : 0.35 + near * 0.35;
		};
		window.addEventListener('wheel', onWheel, { capture: true, passive: true });
		return () => window.removeEventListener('wheel', onWheel, { capture: true });
	});

	const flyDir = new Vector3();
	let flying = false;
	let flyTarget = 0;
	const lastPos = new Vector3();
	let moveIdle = 0;

	$effect(() => {
		const f = ui.flyTo;
		if (f) {
			flyDir.copy(latLngToVector3(f.lat, f.lng, 1)).normalize();
			flyTarget = f.dist ?? 0;
			flying = true;
		}
	});


	$effect(() => {
		const z = view.zoom;
		if (z) {
			const cam = camera.current;
			if (cam) flyDir.copy(cam.position).normalize();
			flyTarget = z.dist;
			flying = true;
		}
	});

	useTask((delta) => {
		const cam = camera.current;
		if (cam) view.camera = cam;
		view.width = size.current.width;
		view.height = size.current.height;
		if (cam) {
			const d = cam.position.length();
			const dr = Math.round(d * 100) / 100;

			if (view.dist !== dr) view.dist = dr;

			if (cam.position.distanceToSquared(lastPos) > 1e-6) {
				view.moving = true;
				moveIdle = 0;
			} else {
				moveIdle += delta;
				if (view.moving && moveIdle > 0.2) view.moving = false;
			}

			lastPos.copy(cam.position);

			if (controls) {
				const near = Math.max(0, Math.min(1, (d - 1.1) / (4 - 1.1))); // 0 close, 1 far
				controls.rotateSpeed = 0.06 + near * 0.5;
			}
		}

		stars.rotation.y += delta * 0.004;

		if (flying && cam) {
			const k = Math.min(1, delta * 2.5);
			const curDist = cam.position.length();
			const target = flyTarget || curDist;
			const cur = cam.position.clone().normalize();
			cur.lerp(flyDir, k).normalize();
			const nd = curDist + (target - curDist) * k;
			cam.position.copy(cur.multiplyScalar(nd));
			cam.lookAt(0, 0, 0);
			controls?.update?.();
			if (cur.angleTo(flyDir) < 0.02 && Math.abs(nd - target) < 0.03) flying = false;
		}
	});

	const stars = createStarfield();
	const moon = createMoon();
	const { geometry: earthGeo, material: earthMat } = createEarth();


	const ATMOSPHERE = Array.from({ length: 24 }, (_, i) => {
		const t = i / 23;
		return {
			scale: 1.012 + t * 0.46,
			opacity: 0.055 * Math.pow(1 - t, 2.2),
			color: new Color('#8ec8ff').lerp(new Color('#2c5fa6'), t).getStyle()
		};
	});


	function createEarth() {
		const geometry = new SphereGeometry(1, 200, 200);
		const ocean = new Color('#0a1c36').convertSRGBToLinear();
		const land = new Color('#3c566e').convertSRGBToLinear();
		const pos = geometry.attributes.position;
		const colors = new Float32Array(pos.count * 3);
		const v = new Vector3();

		for (let i = 0; i < pos.count; i++) {
			v.fromBufferAttribute(pos, i);
			const { lat, lng } = vector3ToLatLng(v);
			const c = isLand(lat, lng) ? land : ocean;
			colors[i * 3] = c.r;
			colors[i * 3 + 1] = c.g;
			colors[i * 3 + 2] = c.b;
		}

		geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));

		const material = new MeshStandardMaterial({
			vertexColors: true,
			roughness: 0.9,
			metalness: 0.05,
			emissive: new Color('#16344f'),
			emissiveIntensity: 0.22
		});

		return { geometry, material };
	}

	function makeMoonTexture(): CanvasTexture {
		const s = 512;
		const cv = document.createElement('canvas');
		cv.width = s;
		cv.height = s;
		const ctx = cv.getContext('2d')!;
		ctx.fillStyle = '#b7bac2';
		ctx.fillRect(0, 0, s, s);

		const maria: [number, number, number][] = [
			[0.36, 0.4, 0.2],
			[0.62, 0.56, 0.15],
			[0.5, 0.72, 0.12],
			[0.72, 0.32, 0.1]
		];
		for (const [mx, my, mr] of maria) {
			const g = ctx.createRadialGradient(mx * s, my * s, 0, mx * s, my * s, mr * s);
			g.addColorStop(0, 'rgba(122,126,138,0.55)');
			g.addColorStop(1, 'rgba(122,126,138,0)');
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(mx * s, my * s, mr * s, 0, 7);
			ctx.fill();
		}

		for (let i = 0; i < 150; i++) {
			const x = Math.random() * s;
			const y = Math.random() * s;
			const r = 2 + Math.random() * Math.random() * 24;
			const g = ctx.createRadialGradient(x, y, 0, x, y, r);
			g.addColorStop(0, 'rgba(74,76,84,0.5)');
			g.addColorStop(0.72, 'rgba(150,153,160,0)');
			g.addColorStop(0.86, 'rgba(228,231,237,0.55)');
			g.addColorStop(1, 'rgba(150,153,160,0)');
			ctx.fillStyle = g;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, 7);
			ctx.fill();
		}

		const img = ctx.getImageData(0, 0, s, s);
		const d = img.data;
		for (let i = 0; i < d.length; i += 4) {
			const n = (Math.random() - 0.5) * 16;
			d[i] += n;
			d[i + 1] += n;
			d[i + 2] += n;
		}
		ctx.putImageData(img, 0, 0);

		const tex = new CanvasTexture(cv);
		tex.colorSpace = SRGBColorSpace;
		return tex;
	}

	function createMoon(): Mesh {
		const tex = makeMoonTexture();
		const geo = new SphereGeometry(0.55, 96, 96);
		const mat = new MeshStandardMaterial({
			map: tex,
			bumpMap: tex,
			bumpScale: 1.1,
			color: new Color('#cdd1d9'),
			roughness: 1,
			metalness: 0,
			emissive: new Color('#0a0c12'),
			emissiveIntensity: 0.04
		});

		const m = new Mesh(geo, mat);
		m.position.set(-9, 3.4, -5);

		return m;
	}

	const graticule = createGraticule();
	const atmoGeo = new SphereGeometry(1, 32, 32);

	function createGraticule(): LineSegments {
		const grat = geoGraticule10();
		const pos: number[] = [];

		for (const line of grat.coordinates) {
			for (let i = 0; i < line.length - 1; i++) {
				const a = latLngToVector3(line[i][1], line[i][0], 1.0009);
				const b = latLngToVector3(line[i + 1][1], line[i + 1][0], 1.0009);
				pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
			}
		}

		const g = new BufferGeometry();
		g.setAttribute('position', new Float32BufferAttribute(pos, 3));

		const m = new LineBasicMaterial({
			color: 0x6fb4ff,
			transparent: true,
			opacity: 0.06,
			depthWrite: false
		});

		return new LineSegments(g, m);
	}

	onDestroy(() => {
		earthGeo.dispose();
		earthMat.dispose();
		moon.geometry.dispose();
		(moon.material as MeshStandardMaterial).map?.dispose();
		(moon.material as MeshStandardMaterial).dispose();
		graticule.geometry.dispose();
		(graticule.material as LineBasicMaterial).dispose();
		atmoGeo.dispose();

		stars.traverse((o) => {
			const p = o as Points;
			p.geometry?.dispose?.();
			(p.material as PointsMaterial)?.dispose?.();
		});
	});

	function handleMove(e: { point?: Vector3; nativeEvent?: PointerEvent }) {
		if (e.nativeEvent) ui.pointer = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
		view.cursorLL = e.point ? vector3ToLatLng(e.point) : null;
	}

	function handleLeave() {
		ui.hovered = null;
		view.cursorLL = null;
	}


	function zoneUnder(e: { point?: Vector3 }): { z: typeof ui.hovered; lat: number; lng: number } {
		let z = ui.hovered;
		let lat = 0;
		let lng = 0;

		if (e.point) {
			({ lat, lng } = vector3ToLatLng(e.point));
			if (!z) z = zoneAtPoint(lat, lng);
		}

		return { z, lat, lng };
	}

	function handleClick(e: { point?: Vector3 }) {
		const { z, lat, lng } = zoneUnder(e);
		if (z) {
			openZone(z);
			return;
		}
		if (e.point) {
			ui.probe = { lat, lng };
			flyToLocation(lat, lng);
		}
	}

	function handleContext(e: { point?: Vector3; nativeEvent?: MouseEvent }) {
		e.nativeEvent?.preventDefault?.();
		const { z } = zoneUnder(e);
		if (z) togglePin(z.id);
	}


	function makeStars(count: number, radius: number, size: number, opacity: number, color: number, band = false): Points {
		const positions = new Float32Array(count * 3);

		for (let i = 0; i < count; i++) {
			const u = band ? (Math.random() * 2 - 1) * 0.16 : Math.random() * 2 - 1;
			const a = Math.random() * Math.PI * 2;
			const r = Math.sqrt(Math.max(0, 1 - u * u));
			const d = radius * (0.85 + Math.random() * 0.15);
			positions[i * 3] = r * Math.cos(a) * d;
			positions[i * 3 + 1] = u * d;
			positions[i * 3 + 2] = r * Math.sin(a) * d;
		}

		const geo = new BufferGeometry();
		geo.setAttribute('position', new BufferAttribute(positions, 3));

		const mat = new PointsMaterial({
			color,
			size,
			sizeAttenuation: true,
			transparent: true,
			opacity,
			depthWrite: false
		});

		return new Points(geo, mat);
	}

	function createStarfield(): Group {
		const g = new Group();
		g.add(makeStars(2000, 92, 0.1, 0.5, 0xb9c6e0)); // faint dust
		g.add(makeStars(700, 90, 0.2, 0.82, 0xdce6f7)); // mid
		g.add(makeStars(70, 88, 0.42, 0.95, 0xffffff)); // bright few
		const band = makeStars(1500, 86, 0.12, 0.42, 0xa7b6dd, true); // Milky Way
		band.rotation.set(0.5, 0.3, 0.9);
		g.add(band);
		return g;
	}
</script>

<T.PerspectiveCamera makeDefault position={[0, 0.5, 3.2]} fov={42} near={0.02} far={2000}>
	<OrbitControls
		bind:ref={controls}
		enableDamping
		dampingFactor={0.11}
		minDistance={1.1}
		maxDistance={9}
		zoomSpeed={0.4}
		rotateSpeed={0.85}
		minPolarAngle={0.22}
		maxPolarAngle={Math.PI - 0.22}
		enablePan={false}
	/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.34} color="#8ea6c8" />
<T.DirectionalLight position={[5, 2.5, 4]} intensity={1.95} color="#fff1d6" />

<T.Mesh
	geometry={earthGeo}
	material={earthMat}
	onpointermove={handleMove}
	onpointerleave={handleLeave}
	onclick={handleClick}
	oncontextmenu={handleContext}
/>

{#if DottedEarth}<DottedEarth />{/if}
<T is={graticule} />
{#if Coastlines}<Coastlines />{/if}
{#if FieldLayer}<FieldLayer />{/if}

{#each ATMOSPHERE as a (a.scale)}
	<T.Mesh geometry={atmoGeo} scale={a.scale}>
		<T.MeshBasicMaterial
			color={a.color}
			transparent
			opacity={a.opacity}
			side={BackSide}
			blending={AdditiveBlending}
			depthWrite={false}
		/>
	</T.Mesh>
{/each}

<T is={moon} />
<T is={stars} />

<script lang="ts">
	import { latLngToVector3 } from '$lib/utils/geo';
	import { isLand } from '$lib/utils/land-mask';
	import { T } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import { BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from 'three';

	const DEG2RAD = Math.PI / 180;
	const STEP = 2.1;

	const positions: number[] = [];

	for (let lat = -84; lat <= 84; lat += STEP) {
		const lngStep = STEP / Math.max(0.18, Math.cos(lat * DEG2RAD));

		for (let lng = -180; lng < 180; lng += lngStep) {
			if (isLand(lat, lng)) {
				const p = latLngToVector3(lat, lng, 1.0015);
				positions.push(p.x, p.y, p.z);
			}
		}
	}

	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

	const material = new PointsMaterial({
		color: 0x3f6286,
		size: 0.0095,
		sizeAttenuation: true,
		transparent: true,
		opacity: 0.6,
		depthWrite: false
	});

	const points = new Points(geometry, material);

	onDestroy(() => {
		geometry.dispose();
		material.dispose();
	});
</script>

<T is={points} />

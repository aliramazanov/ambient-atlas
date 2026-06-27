<script lang="ts">
	import { T } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import { BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LineSegments } from 'three';
	import { mesh } from 'topojson-client';
	// world-atlas ships plain topojson; typed loosely. 10m is the highest-detail
	// set for precise borders that hold up at the deepest zoom.
	import countries from 'world-atlas/countries-10m.json';
	import { latLngToVector3 } from '$lib/utils/geo';

	const RADIUS = 1.004;

	const topo = countries as unknown as {
		objects: { countries: Parameters<typeof mesh>[1] };
	};
	const lines = mesh(countries as never, topo.objects.countries) as unknown as {
		coordinates: [number, number][][];
	};

	const positions: number[] = [];
	for (const line of lines.coordinates) {
		for (let i = 0; i < line.length - 1; i++) {
			const a = latLngToVector3(line[i][1], line[i][0], RADIUS);
			const b = latLngToVector3(line[i + 1][1], line[i + 1][0], RADIUS);
			positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
		}
	}

	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	const material = new LineBasicMaterial({ color: 0x2f5571, transparent: true, opacity: 0.5 });
	const segments = new LineSegments(geometry, material);
	segments.renderOrder = 1;

	onDestroy(() => {
		geometry.dispose();
		material.dispose();
	});
</script>

<T is={segments} />

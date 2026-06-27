import { anthroSubOf } from '$lib/data/scales/categories';
import { zoneRadiusDeg } from '$lib/data/scales/reach';
import type { Zone } from '$lib/data/zones/types';
import { zones } from '$lib/data/zones/zones';
import { ui } from '$lib/state/state.svelte';
import { angularDistanceDeg } from '$lib/utils/geo';
import { clipFor } from './conflict-clip';


const HIT_DEG = 1.7;

function isVisible(z: Zone): boolean {
	if (!ui.tiers[z.tier]) return false;
	if (z.tier === 'established' && !ui.cats[z.category]) return false;
	if (z.tier === 'anthropogenic' && !ui.cats[anthroSubOf(z)]) return false;
	return true;
}

export function dominantZone(lat: number, lng: number): Zone | null {
	let best: Zone | null = null;
	let bestD = HIT_DEG;

	for (const z of zones) {
		if (!isVisible(z)) continue;
		const d = angularDistanceDeg(lat, lng, z.lat, z.lng);
		if (d < bestD) {
			bestD = d;
			best = z;
		}
	}

	return best;
}


export function zoneAtPoint(lat: number, lng: number): Zone | null {
	let best: Zone | null = null;
	let bestD = Infinity;

	for (const z of zones) {
		if (!isVisible(z)) continue;

		const clip = clipFor(z.id);
		if (clip) {
			if (clip(lat, lng)) {
				const d = angularDistanceDeg(lat, lng, z.lat, z.lng);

				if (d < bestD) {
					bestD = d;
					best = z;
				}
			}

			continue;
		}

		const d = angularDistanceDeg(lat, lng, z.lat, z.lng);

		if (d <= zoneRadiusDeg(z) && d < bestD) {
			bestD = d;
			best = z;
		}
	}

	return best;
}

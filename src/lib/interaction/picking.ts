import { zones } from '$lib/data/zones/zones';
import type { Zone } from '$lib/data/zones/types';
import { angularDistanceDeg } from '$lib/utils/geo';
import { zoneRadiusDeg } from '$lib/data/scales/reach';
import { anthroSubOf } from '$lib/data/scales/categories';
import { clipFor } from './conflict-clip';
import { ui } from '$lib/state/state.svelte';

// Hover targets the epicenter dot (the map reads as dots until you point at one),
// with a generous hit radius for easy targeting.
const HIT_DEG = 1.7;

/** Is the zone currently shown given tier and sub-category toggles. */
function isVisible(z: Zone): boolean {
	if (!ui.tiers[z.tier]) return false;
	if (z.tier === 'established' && !ui.cats[z.category]) return false;
	if (z.tier === 'anthropogenic' && !ui.cats[anthroSubOf(z)]) return false;
	return true;
}

/** The nearest visible zone whose epicenter is within the hover hit radius. */
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

/**
 * The most relevant visible zone whose REACH contains the point, used on click so
 * clicking anywhere inside a glow (not just the dot) selects it. Conflict zones
 * match by country border; others by their reach radius. Ties go to the nearest
 * (most local) center.
 */
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

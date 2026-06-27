export type Tier = 'established' | 'gray' | 'solved' | 'anthropogenic' | 'conflict' | 'climate';

export type Certainty =
	| 'established'
	| 'null-finding'
	| 'contested'
	| 'anecdotal'
	| 'acknowledged-late'
	| 'solved-firm'
	| 'solved-debated'
	| 'open';

export type EmissionType = 'ionizing' | 'rf' | 'chemical' | 'mixed';

export interface Citation {
	type: 'agency' | 'primary' | 'review' | 'skeptical' | 'preprint';
	/** Short human label, for example "Hendry et al. 2009, J Radiol Prot". */
	ref: string;
	url: string;
	openAccess: boolean;
	doi?: string;
}

export interface Zone {
	id: string;
	name: string;
	tier: Tier;
	/** Established subcategory (radiation, altitude, ...) or the tier name otherwise. */
	category: string;
	lat: number;
	lng: number;
	/** Original arbitrary radius from the research (legacy; reach now drives size). */
	r: number;
	/** Estimated real-world reach of impact in km (overrides the reach default). */
	reachKm?: number;
	desc: string;
	/** What it can do to human health (shown in the reader). */
	health?: string;
	certainty?: Certainty;
	/** Indicative health-impact severity if exposed, 1 (mild) to 5 (catastrophic). */
	severity?: number;
	/** Indicative research depth, 1 (anecdotal) to 5 (extensively studied). */
	research?: number;
	emissionType?: EmissionType;
	/** Coordinates are approximate / illustrative for this zone. */
	approx?: boolean;
	citations: Citation[];
}

export interface GlobalQuestion {
	id: string;
	name: string;
	desc: string;
	citations: Citation[];
}

/** Map the research radius units to a great-circle radius in degrees. */
export function radiusDegFor(r: number): number {
	const d = Math.sqrt(r) * 1.0;
	return Math.min(22, Math.max(1.6, d));
}

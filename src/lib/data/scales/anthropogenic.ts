import type { Zone } from '../zones/types';

// Sub-classification of the anthropogenic tier into five scientifically distinct
// groups. This is a pure function of the zone (no external data), so it is
// computed at runtime rather than generated: keyword rules plus a reviewed
// override list for the cases the keywords get wrong. Results are memoized by id.
export type AnthroSub = 'nuclear' | 'mining' | 'fossil' | 'industrial' | 'waste';

// Reviewed corrections (scientifically checked) for keyword misfires.
const OVERRIDE: Record<string, AnthroSub> = {
	'kempen-campine-cadmium': 'mining',
	'flin-flon-smelter': 'mining',
	'patos-marinza-oil': 'fossil',
	'nauru-phosphate': 'mining',
	'banaba-phosphate': 'mining',
	'santa-susana': 'nuclear',
	flint: 'industrial',
	'citarum-river': 'industrial',
	minamata: 'industrial',
	'lapindo-sidoarjo': 'fossil',
	hinkley: 'industrial',
	'oinofyta-asopos-chromium': 'industrial',
	'la-teja-lead': 'industrial',
	'abidjan-probo-koala': 'waste',
	sumgayit: 'industrial',
	'vale-do-ribeira-lead': 'mining',
	'brixlegg-copper': 'mining',
	'depue-zinc': 'mining',
	'guiyu-ewaste': 'waste',
	agbogbloshie: 'waste',
	'lebanon-waste-burning': 'waste',
	'decatur-3m-pfas': 'industrial',
	'times-beach-dioxin': 'waste'
};

function classify(z: Zone): AnthroSub {
	const t = `${z.name} ${z.desc}`.toLowerCase();
	if (z.emissionType === 'ionizing') return 'nuclear';
	if (
		/uranium|nuclear|radioactiv|radium|plutonium|reactor|atomic|fallout|test site|test range|downwind|broken arrow|lost bomb|hydrogen bomb|criticality|phosphogypsum|phosphate/.test(
			t
		)
	)
		return 'nuclear';
	if (
		/tanner|battery|trichloro|tetrachloro|solvent|\bpcb\b|dioxin|chlor-alkali|chlorine chemistry|pesticide|herbicide|chemical (plant|complex|legacy|works)|petrochemical|fertili/.test(
			t
		)
	) {
		if (/petrochemical|refiner|oil field|oilfield/.test(t)) return 'fossil';
		return 'industrial';
	}
	if (
		/coal|lignite|\boil\b|petroleum|refiner|flaring|oil sand|oil field|oilfield|oil pollution|\bcoke\b|tar pond|tar sand|gas field|gas extraction|natural gas|power (plant|station)|fly ash|coal-ash|coal ash/.test(
			t
		)
	)
		return 'fossil';
	if (
		/\bmine\b|mining|smelter|smelting|tailings|\bore\b|copper|lead|zinc|\bgold\b|silver|mercury|arsenic|antimony|manganese|nickel|cobalt|bauxite|alumina|red mud|aluminium|alunite|magnesite|chrom|cadmium|\bslag\b|acid mine drainage|acid drainage|amalgam|asgm|pyrite|realgar|cinnabar|asbestos|crocidolite|chrysotile|vermiculite/.test(
			t
		)
	)
		return 'mining';
	if (/e-?waste|\bwaste\b|\bdump\b|landfill|garbage|open burning/.test(t)) return 'waste';
	return 'industrial';
}

const cache = new Map<string, AnthroSub>();

export function anthroSubOf(zone: Zone): AnthroSub {
	const hit = cache.get(zone.id);
	if (hit) return hit;
	const sub = OVERRIDE[zone.id] ?? classify(zone);
	cache.set(zone.id, sub);
	return sub;
}

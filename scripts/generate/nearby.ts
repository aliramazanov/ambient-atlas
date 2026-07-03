import { writeFileSync } from 'node:fs';
import allCitiesPkg from 'all-the-cities';

const allCities = (allCitiesPkg as { default?: unknown }).default ?? allCitiesPkg;

const MIN_POP = 30000;

type RawCity = { name: string; population: number; loc: { coordinates: [number, number] } };

const rows = (allCities as RawCity[])
	.filter((c) => c.population >= MIN_POP)
	.map(
		(c) =>
			[
				c.name,
				Math.round(c.loc.coordinates[1] * 1000) / 1000,
				Math.round(c.loc.coordinates[0] * 1000) / 1000
			] as [string, number, number]
	);

const body = `export const nearby: [string, number, number][] = ${JSON.stringify(rows)};\n`;
writeFileSync('src/lib/data/generated/nearby.ts', body);
console.log('nearby cities:', rows.length);

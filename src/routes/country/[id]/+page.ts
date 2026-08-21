import { countryIso3List } from '$lib/data/places/countries';

export const entries = () => countryIso3List.map((id) => ({ id }));

import { zones } from '$lib/data/zones/zones';

export const entries = () => zones.map((z) => ({ id: z.id }));

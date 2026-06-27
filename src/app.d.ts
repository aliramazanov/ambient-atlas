// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    // interface Locals {}
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

declare module "world-countries" {
  interface WorldCountry {
    cca2: string;
    cca3: string;
    ccn3: string;
    name: { common: string; official: string };
  }
  const countries: WorldCountry[];
  export default countries;
}

export {};

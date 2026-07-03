declare global {
  namespace App {
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

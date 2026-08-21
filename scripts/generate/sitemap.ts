import { writeFileSync } from "node:fs";
import { countryIso3List } from "../../src/lib/data/places/countries.ts";
import { zones } from "../../src/lib/data/zones/zones.ts";

const origin = (process.env.PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

if (!origin) {
  console.log(
    "PUBLIC_SITE_URL is not set, so no sitemap was written.\n" +
      "A sitemap needs absolute URLs; writing one against a guessed origin would be worse than none.\n" +
      "Set it and re-run, for example:\n" +
      "  PUBLIC_SITE_URL=https://your-domain pnpm data:sitemap",
  );
  process.exit(0);
}

interface Entry {
  path: string;
  priority: string;
}

const entries: Entry[] = [
  { path: "/", priority: "1.0" },
  { path: "/about", priority: "0.6" },
  { path: "/rankings", priority: "0.7" },
  ...zones.map((z) => ({ path: `/zone/${z.id}`, priority: "0.8" })),
  ...countryIso3List.map((iso) => ({ path: `/country/${iso}`, priority: "0.5" })),
];

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries.map(
    (e) =>
      `  <url><loc>${origin}${e.path}</loc><priority>${e.priority}</priority></url>`,
  ),
  "</urlset>",
  "",
].join("\n");

writeFileSync("static/sitemap.xml", xml);

writeFileSync(
  "static/robots.txt",
  ["User-agent: *", "Disallow:", "", `Sitemap: ${origin}/sitemap.xml`, ""].join(
    "\n",
  ),
);

console.log(`sitemap.xml: ${entries.length} urls at ${origin}`);
console.log("robots.txt: sitemap reference updated");

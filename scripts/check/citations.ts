// Resolve every DOI in the dataset against the Crossref API and report failures.
// Usage: node scripts/validate-citations.ts
import { readFile } from "node:fs/promises";

const FILES = ["src/lib/data/zones/zones.ts", "src/lib/data/zones/questions.ts"];
const DOI_RE = /doi:\s*'([^']+)'/g;

const dois = new Set();
for (const f of FILES) {
  const text = await readFile(f, "utf8");
  let m;
  while ((m = DOI_RE.exec(text)) !== null) dois.add(m[1]);
}

console.log(`Found ${dois.size} DOIs to verify.\n`);

let ok = 0;
let bad = 0;
for (const doi of dois) {
  try {
    const res = await fetch(
      `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
      {
        headers: {
          "User-Agent":
            "ambient-atlas-citation-check/1.0 (mailto:toaliramazanov@tutamail.com)",
        },
      },
    );
    if (res.ok) {
      ok++;
      console.log("OK   ", doi);
    } else {
      bad++;
      console.log("FAIL ", doi, `(http ${res.status})`);
    }
  } catch (err) {
    bad++;
    console.log("ERROR", doi, err.message);
  }
}

console.log(`\n${ok} resolved, ${bad} failed.`);
process.exit(bad ? 1 : 0);

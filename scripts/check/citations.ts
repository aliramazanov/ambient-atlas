import { zones } from "../../src/lib/data/zones/zones.ts";
import { questions } from "../../src/lib/data/zones/questions.ts";

const online = process.argv.includes("--online");

const items = [
  ...zones.map((z) => ({ id: z.id, name: z.name, citations: z.citations })),
  ...questions.map((q) => ({ id: q.id, name: q.name, citations: q.citations })),
];

const urlRe = /^https?:\/\/\S+$/;
let bad = 0;

for (const it of items) {
  if (!it.citations || it.citations.length === 0) {
    console.log("MISSING citation:", it.id, "-", it.name);
    bad++;
    continue;
  }
  for (const c of it.citations) {
    if (!c.ref || !String(c.ref).trim()) {
      console.log("EMPTY ref:", it.id, "-", c.url ?? "");
      bad++;
    }
    if (!c.url || !urlRe.test(c.url)) {
      console.log("BAD url:", it.id, "-", c.ref ?? "", "->", c.url ?? "(none)");
      bad++;
    }
  }
}

console.log(`\nChecked ${items.length} entries; ${bad} citation problem(s).`);

if (online) {
  const dois = new Set<string>();
  for (const it of items)
    for (const c of it.citations) if (c.doi) dois.add(c.doi);

  console.log(`\nResolving ${dois.size} DOIs against Crossref...\n`);
  let doiBad = 0;
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
      if (res.ok) console.log("OK   ", doi);
      else {
        console.log("FAIL ", doi, `(http ${res.status})`);
        doiBad++;
      }
    } catch (err) {
      console.log("ERROR", doi, (err as Error).message);
      doiBad++;
    }
  }
  console.log(`\n${dois.size - doiBad} resolved, ${doiBad} failed.`);
  bad += doiBad;
}

process.exit(bad ? 1 : 0);

# Ambient Atlas

An interactive, cited 3D-globe atlas of places people live inside chronic ambient health
exposures, natural and man-made, built on a WebGPU-first stack. Every zone carries a tier,
a lifecycle status, certainty tags, and scientific citations.

## How it works

- The globe lives in the layout and persists across routes. `/zone/[id]` opens the citation
  reader for a zone (shareable links); closing it returns to `/`. Heavy detail layers
  (borders, land dots, the glow field) load after the first paint so the globe appears fast.
- Zones render as dots by default; a zone's reach glow appears on hover, when pinned, or via
  the "Show all reach areas" toggle. Color encodes category, with the anthropogenic tier split
  into five scientifically distinct sub-categories (nuclear, mining, fossil, industrial, waste).
- `src/lib/geo.ts` is the shared sphere math; `landMask.ts` rasterizes land once for fast
  land/ocean tests; `picking.ts` finds the zone under the cursor or inside a reach.

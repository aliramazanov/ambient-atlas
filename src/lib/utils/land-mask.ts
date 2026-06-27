import { geoEquirectangular, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import land110 from "world-atlas/land-110m.json";

// Fast land/ocean test. Instead of running d3 geoContains against the land
// polygons for every query (tens of thousands at startup, slow), we rasterize
// the 110m land once into a small equirectangular bitmap and sample pixels. The
// projection is set so a pixel maps linearly to lon/lat, so sampling is O(1).
const W = 1024;
const H = 512; // must be W/2 for a full equirectangular sphere
let data: Uint8ClampedArray | null = null;

function build() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const landFeature = feature(land110 as any, (land110 as any).objects.land);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const proj = geoEquirectangular()
    .scale(W / (2 * Math.PI))
    .translate([W / 2, H / 2]);
  const path = geoPath(proj, ctx);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  path(landFeature as any);
  ctx.fill();
  data = ctx.getImageData(0, 0, W, H).data;
}

export function isLand(lat: number, lng: number): boolean {
  if (!data) build();
  let x = Math.floor(((lng + 180) / 360) * W);
  let y = Math.floor(((90 - lat) / 180) * H);
  if (x < 0) x = 0;
  else if (x >= W) x = W - 1;
  if (y < 0) y = 0;
  else if (y >= H) y = H - 1;
  return data![(y * W + x) * 4] > 128;
}

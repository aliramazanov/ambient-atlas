import type { Camera } from "three";

/** Manual zoom bounds (kept just inside the OrbitControls min/max distance). */
export const MIN_DIST = 1.2;
export const MAX_DIST = 8.5;

export const view = $state<{
  camera: Camera | null;
  width: number;
  height: number;
  /** Camera distance from globe center (1 = surface) */
  dist: number;
  /** True while the camera is actively moving (rotate or zoom) */
  moving: boolean;
  focusX: number;
  focusY: number;
  hasFocus: boolean;
  /** True when the pointer is over UI chrome (a panel), not the globe canvas. */
  overUI: boolean;
  /** Geographic point under the cursor on the globe (null when off-globe). */
  cursorLL: { lat: number; lng: number } | null;
  /** Manual zoom request from the zoom console; token forces a re-trigger. */
  zoom: { dist: number; token: number } | null;
}>({
  camera: null,
  width: 0,
  height: 0,
  dist: 3.2,
  moving: false,
  focusX: 0,
  focusY: 0,
  hasFocus: false,
  overUI: false,
  cursorLL: null,
  zoom: null,
});

let zoomToken = 0;

/** Dolly the camera by a factor of the current distance (<1 in, >1 out). */
export function zoomBy(factor: number) {
  const target = Math.max(MIN_DIST, Math.min(MAX_DIST, view.dist * factor));
  zoomToken += 1;
  view.zoom = { dist: target, token: zoomToken };
}

/** 0..1 zoom level for the console readout (1 = closest). */
export function zoomLevel(): number {
  return Math.max(
    0,
    Math.min(1, (MAX_DIST - view.dist) / (MAX_DIST - MIN_DIST)),
  );
}

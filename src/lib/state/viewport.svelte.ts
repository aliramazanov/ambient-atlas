import type { Camera } from "three";

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
}>({
  camera: null,
  width: 0,
  height: 0,
  dist: 3.2,
  moving: false,
  focusX: 0,
  focusY: 0,
  hasFocus: false,
});

import type { Camera } from 'three';

// Bridge from the Threlte render context (inside the Canvas) to the DOM label
// overlay (outside the Canvas). Updated each frame in Scene. focusX/focusY are
// the pointer position in stage pixels; labels reveal around it.
export const view = $state<{
	camera: Camera | null;
	width: number;
	height: number;
	/** Camera distance from globe center (1 = surface). Drives zoom-aware UI. */
	dist: number;
	/** True while the camera is actively moving (rotate or zoom). */
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
	hasFocus: false
});

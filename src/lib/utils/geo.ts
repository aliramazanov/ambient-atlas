import { Vector3 } from "three";

/**
 * Convert geographic coordinates to a point on a sphere.
 * The mapping is aligned with an equirectangular texture where longitude runs
 * left to right and latitude bottom to top, so the same convention is reused by
 * the field texture and by hit testing.
 */

export function latLngToVector3(
  latDeg: number,
  lngDeg: number,
  radius = 1,
): Vector3 {
  const phi = (90 - latDeg) * (Math.PI / 180);
  const theta = (lngDeg + 180) * (Math.PI / 180);
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new Vector3(x, y, z);
}

export function vector3ToLatLng(v: Vector3): { lat: number; lng: number } {
  const n = v.clone().normalize();
  const lat = 90 - (Math.acos(n.y) * 180) / Math.PI;
  const lng = (Math.atan2(n.z, -n.x) * 180) / Math.PI - 180;
  return { lat, lng: normalizeLng(lng) };
}

function normalizeLng(lng: number): number {
  let l = lng;
  while (l < -180) l += 360;
  while (l > 180) l -= 360;
  return l;
}

export function angularDistanceDeg(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = Math.PI / 180;
  const a1 = lat1 * toRad;
  const a2 = lat2 * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const cosD =
    Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(dLng);

  return (Math.acos(Math.min(1, Math.max(-1, cosD))) * 180) / Math.PI;
}

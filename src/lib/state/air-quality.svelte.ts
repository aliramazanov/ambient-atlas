import { cities } from "../data/generated/places";

// Live US AQI for the city list, fetched on demand from the Open-Meteo Air
// Quality API. `aqi` is one big parallel array (indexed by city) that we only
// ever replace wholesale, so it is $state.raw to skip deep-proxy overhead: it is
// read per-frame in the render loop where proxy get-traps would add up.
type AirStatus = "idle" | "loading" | "ready" | "error";

let status = $state<AirStatus>("idle");
let aqi = $state.raw<(number | null)[]>([]);

export const air = {
  get status() {
    return status;
  },
  get aqi() {
    return aqi;
  },
};

let started = false;
const CHUNK = 80;
const ENDPOINT = "https://air-quality-api.open-meteo.com/v1/air-quality";

export async function ensureAirData(): Promise<void> {
  if (started) return;
  started = true;
  status = "loading";
  const result: (number | null)[] = new Array(cities.length).fill(null);
  try {
    for (let i = 0; i < cities.length; i += CHUNK) {
      const slice = cities.slice(i, i + CHUNK);
      const lat = slice.map((c) => c.lat.toFixed(3)).join(",");
      const lng = slice.map((c) => c.lng.toFixed(3)).join(",");
      const url = `${ENDPOINT}?latitude=${lat}&longitude=${lng}&current=us_aqi&timezone=GMT`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`air quality ${res.status}`);
      let data = await res.json();
      if (!Array.isArray(data)) data = [data];
      for (let j = 0; j < data.length; j++) {
        const v = data[j]?.current?.us_aqi;
        result[i + j] = typeof v === "number" ? v : null;
      }
    }
    aqi = result;
    status = "ready";
  } catch (err) {
    console.error("[airquality] fetch failed:", err);
    status = "error";
    started = false;
  }
}

/** US AQI category color, premium pastel version of the EPA scale. */
export function aqiColor(v: number): string {
  if (v <= 50) return "#8fd6a4";
  if (v <= 100) return "#f0d27e";
  if (v <= 150) return "#f0b079";
  if (v <= 200) return "#ec8a8a";
  if (v <= 300) return "#b896d6";
  return "#bd7286";
}

export const AQI_LEGEND: { label: string; color: string }[] = [
  { label: "Good (0-50)", color: "#8fd6a4" },
  { label: "Moderate (51-100)", color: "#f0d27e" },
  { label: "Sensitive (101-150)", color: "#f0b079" },
  { label: "Unhealthy (151-200)", color: "#ec8a8a" },
  { label: "Very unhealthy (201-300)", color: "#b896d6" },
  { label: "Hazardous (301+)", color: "#bd7286" },
];

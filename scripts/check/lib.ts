import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type UrlState = "ok" | "missing-file" | "bad";

const absoluteRe = /^https?:\/\/\S+$/;
const rootRelativeRe = /^\/\S+$/;
const staticDir = fileURLToPath(new URL("../../static/", import.meta.url));

export function resolveUrl(url: string): UrlState {
  if (absoluteRe.test(url)) return "ok";
  if (!rootRelativeRe.test(url)) return "bad";
  const file = decodeURIComponent(url.split(/[#?]/)[0]).slice(1);
  return existsSync(staticDir + file) ? "ok" : "missing-file";
}

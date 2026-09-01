import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Session } from "./cdp.ts";

const PREVIEW_PORT = 4183;
const DEBUG_PORT = 9333;
const OVERALL_TIMEOUT_MS = 6 * 60_000;
const HOST = "127.0.0.1";
const ORIGIN = `http://${HOST}:${PREVIEW_PORT}`;

const CHROME_CANDIDATES = [
  process.env.CHROME_BIN,
  "google-chrome",
  "google-chrome-stable",
  "chromium",
  "chromium-browser",
].filter((c): c is string => !!c);

interface Route {
  path: string;
  expect: string;
  settleMs: number;
  canvas: boolean;
}

const ROUTES: Route[] = [
  { path: "/", expect: "Ambient Atlas", settleMs: 9000, canvas: true },
  {
    path: "/zone/chernobyl",
    expect: "Chernobyl exclusion zone",
    settleMs: 7000,
    canvas: true,
  },
  { path: "/country/AZE", expect: "Azerbaijan", settleMs: 5000, canvas: false },
  {
    path: "/country/USA",
    expect: "United States",
    settleMs: 5000,
    canvas: false,
  },
  {
    path: "/rankings",
    expect: "Build your own ranking",
    settleMs: 4000,
    canvas: false,
  },
  { path: "/about", expect: "Sources", settleMs: 4000, canvas: false },
];

/** Software WebGL notices from a headless runner with no GPU, not app faults. */
const ENVIRONMENTAL = [
  /WebGPU is not available/i,
  /No available adapters/i,
  /swiftshader/i,
  /GL Driver Message/i,
  /Automatic fallback to software WebGL/i,
  /favicon/i,
];

function resolveChrome(): string {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate.includes("/")) {
      if (existsSync(candidate)) return candidate;
      continue;
    }

    const found = spawnSync("which", [candidate], { encoding: "utf8" });
    if (found.status === 0 && found.stdout.trim()) return found.stdout.trim();
  }

  throw new Error(
    `no Chrome binary found (tried ${CHROME_CANDIDATES.join(", ")}); set CHROME_BIN`,
  );
}

async function waitFor(
  url: string,
  label: string,
  timeoutMs = 60_000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {}

    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`${label} did not come up within ${timeoutMs}ms`);
}

const started: ChildProcess[] = [];
const profile = mkdtempSync(join(tmpdir(), "aa-smoke-"));
let shutDown = false;

/** npx spawns vite as a grandchild, so signal the whole group, not just the child. */
function stop(child: ChildProcess): void {
  if (child.pid == null) return;
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

function shutdown(): void {
  if (shutDown) return;
  shutDown = true;
  clearTimeout(watchdog);
  for (const child of started) stop(child);

  rmSync(profile, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 200,
  });
}

function finish(code: number): never {
  shutdown();
  process.exit(code);
}

const watchdog = setTimeout(() => {
  console.error(`\nsmoke run exceeded ${OVERALL_TIMEOUT_MS / 1000}s, aborting`);
  finish(1);
}, OVERALL_TIMEOUT_MS);

process.on("exit", shutdown);
process.on("SIGINT", () => finish(130));
process.on("SIGTERM", () => finish(143));

if (!existsSync("build/index.html"))
  throw new Error("build/ is missing, run pnpm build first");

const preview = spawn(
  "npx",
  [
    "vite",
    "preview",
    "--host",
    HOST,
    "--port",
    String(PREVIEW_PORT),
    "--strictPort",
  ],
  { stdio: "ignore", detached: true },
);
preview.unref();
started.push(preview);

const chrome = spawn(
  resolveChrome(),
  [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank",
  ],
  { stdio: "ignore", detached: true },
);
chrome.unref();
started.push(chrome);

await waitFor(`${ORIGIN}/`, "vite preview");
await waitFor(`http://${HOST}:${DEBUG_PORT}/json/version`, "headless chrome");

const session = await Session.attach(DEBUG_PORT);
await session.send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

const failures: string[] = [];

for (const route of ROUTES) {
  await session.visit(ORIGIN + route.path, route.settleMs);

  const seen = await session
    .evaluate<{
      text: string;
      title: string;
      canvas: boolean;
    }>(
      `JSON.stringify({
      text: document.body.innerText,
      title: document.title,
      canvas: !!document.querySelector('canvas')
    })`,
    )
    .then((v) => JSON.parse(v as unknown as string));

  const noise = session.entries.filter(
    (e) =>
      !ENVIRONMENTAL.some((p) => p.test(e.text)) &&
      (e.level === "exception" || e.level === "error"),
  );

  if (!seen.text.includes(route.expect))
    failures.push(`${route.path}: expected text "${route.expect}" is missing`);
  if (!seen.title.startsWith("Ambient Atlas"))
    failures.push(`${route.path}: unexpected title "${seen.title}"`);
  if (route.canvas && !seen.canvas)
    failures.push(`${route.path}: the globe canvas never mounted`);
  if (!route.canvas && seen.canvas)
    failures.push(`${route.path}: the globe loaded on a content route`);

  for (const e of noise)
    failures.push(`${route.path}: [${e.level}] ${e.text.split("\n")[0]}`);

  const status = failures.length ? "" : " ok";
  console.log(`  ${route.path.padEnd(20)} ${seen.title}${status}`);
}

session.close();

if (failures.length) {
  console.error(`\n${failures.length} smoke failure(s):`);
  for (const f of failures) console.error(`  ${f}`);
  finish(1);
}

console.log(
  `\n${ROUTES.length} routes served, rendered and stayed console-clean.`,
);
finish(0);

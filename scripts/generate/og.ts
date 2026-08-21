import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { CATEGORIES } from "../../src/lib/data/scales/categories.ts";
import { zones } from "../../src/lib/data/zones/zones.ts";

const CHROME =
  process.env.CHROME_BIN ?? "google-chrome";
const OUT = "static/og";
const TMP = ".svelte-kit/og-tmp";

const cards = [
  { key: "default", label: "A sourced atlas of ambient exposure", color: "#cba869" },
  ...CATEGORIES.map((c) => ({ key: c.key, label: c.label, color: c.color })),
];

function card(label: string, color: string): string {
  const dots = Array.from({ length: 34 }, (_, i) => {
    const x = 60 + ((i * 137) % 1080);
    const y = 470 + ((i * 71) % 130);
    const r = 2 + ((i * 13) % 4);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${0.1 + ((i % 5) * 0.08)}"/>`;
  }).join("");

  return `<!doctype html><meta charset="utf-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{width:1200px;height:630px;background:#04070e;color:#e8eaf1;
      font-family:"DejaVu Sans",system-ui,sans-serif;overflow:hidden;position:relative}
    .glow{position:absolute;inset:0;background:radial-gradient(120% 100% at 50% 8%,#0d1a31 0%,#091123 45%,#04070e 80%)}
    .frame{position:absolute;inset:28px;border:1px solid rgba(150,166,196,.16);border-radius:14px}
    .body{position:absolute;inset:0;padding:96px 92px;display:flex;flex-direction:column;justify-content:center;gap:26px}
    .brand{display:flex;align-items:center;gap:14px;font-size:22px;letter-spacing:.22em;text-transform:uppercase;color:#95a1b7}
    .mark{width:14px;height:14px;border-radius:3px;background:linear-gradient(135deg,#e6c785,#c79a52)}
    h1{font-family:"DejaVu Serif",Georgia,serif;font-size:${label.length > 30 ? 62 : 76}px;line-height:1.05;letter-spacing:-.02em;max-width:16ch}
    .rule{width:150px;height:3px;background:${color};border-radius:2px}
    .foot{position:absolute;left:92px;bottom:76px;font-size:21px;letter-spacing:.05em;color:#6a7688}
    svg{position:absolute;inset:0}
  </style>
  <div class="glow"></div>
  <svg width="1200" height="630">${dots}</svg>
  <div class="frame"></div>
  <div class="body">
    <div class="brand"><span class="mark"></span>Ambient Atlas</div>
    <h1>${label}</h1>
    <div class="rule"></div>
  </div>
  <div class="foot">${zones.length} sourced places &nbsp;·&nbsp; every entry cited</div>`;
}

mkdirSync(OUT, { recursive: true });
mkdirSync(TMP, { recursive: true });

for (const c of cards) {
  const html = `${TMP}/${c.key}.html`;
  writeFileSync(html, card(c.label, c.color));
  execFileSync(
    CHROME,
    [
      "--headless",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      "--window-size=1200,630",
      `--screenshot=${OUT}/${c.key}.png`,
      `file://${process.cwd()}/${html}`,
    ],
    { stdio: "ignore" },
  );
  console.log("wrote", `${OUT}/${c.key}.png`);
}

rmSync(TMP, { recursive: true, force: true });

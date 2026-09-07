// Browser evidence harness for the 2026-09-07 system audit.
//
// For every docs route it captures each `[data-vrt-preview]` fixture as a PNG in five lanes
// (320 / 768 / 1280 light LTR, 1280 dark LTR, 1280 light RTL), dumps computed box metrics for every
// `data-slot` element, runs axe on each fixture, records console errors, and walks the first eight
// Tab stops at 1280 light to capture focus-visible treatment.
//
//   node tooling/audit/capture.mjs --routes button,input   # or --all
//   --port <n>   use an already running `serve out` on that port (else one is started)
//   --no-focus   skip the Tab-walk lane
//   --out <dir>  write elsewhere (default `.audit/`, or $AUDIT_OUT_DIR)
//
// Output: .audit/<route>/…  (gitignored, evidence only — see tooling/audit/out-dir.mjs)
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

import { ROOT as root } from "../lib/fs.mjs";
import { evidenceDir } from "./out-dir.mjs";
const docs = path.join(root, "apps/docs");
const require = createRequire(path.join(docs, "package.json"));
const { chromium } = require("@playwright/test");
const uiRequire = createRequire(path.join(root, "packages/ui/package.json"));
const axeSource = fs.readFileSync(
  uiRequire.resolve("axe-core/axe.min.js"),
  "utf8",
);
const { COMPONENT_ROUTES, BLOCK_ROUTES } = await import(
  path.join(docs, "vrt/contract-routes.generated.ts")
).catch(async () => {
  // .ts import needs a loader on some Node versions; fall back to a regex read.
  const text = fs.readFileSync(
    path.join(docs, "vrt/contract-routes.generated.ts"),
    "utf8",
  );
  const grab = (name) =>
    [
      ...text.matchAll(
        new RegExp(`export const ${name} = \\[([^\\]]*)\\]`, "s"),
      ),
    ][0]?.[1]
      .match(/"[^"]+"/g)
      ?.map((s) => s.slice(1, -1)) ?? [];
  return {
    COMPONENT_ROUTES: grab("COMPONENT_ROUTES"),
    BLOCK_ROUTES: grab("BLOCK_ROUTES"),
  };
});

const args = process.argv.slice(2);
const opt = { routes: null, all: false, port: null, focus: true };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--all") opt.all = true;
  else if (a === "--routes")
    opt.routes = args[++i]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  else if (a === "--port") opt.port = Number(args[++i]);
  else if (a === "--no-focus") opt.focus = false;
}
const allRoutes = [...COMPONENT_ROUTES, ...BLOCK_ROUTES];
const routes = opt.all
  ? allRoutes
  : (opt.routes ?? []).map((r) =>
      r.startsWith("/") ? r : `/docs/components/${r}`,
    );
if (!routes.length) {
  console.error("nothing to capture: pass --all or --routes a,b");
  process.exit(2);
}
for (const r of routes)
  if (!allRoutes.includes(r))
    console.warn(`warning: ${r} is not a contract route`);

const outDir = evidenceDir();

function reservePort() {
  return new Promise((ok, fail) => {
    const p = createServer();
    p.unref();
    p.on("error", fail);
    p.listen(0, "127.0.0.1", () => {
      const { port } = p.address();
      p.close(() => ok(port));
    });
  });
}
const sleep = (ms) => new Promise((d) => setTimeout(d, ms));

let server = null;
let port = opt.port;
if (!port) {
  if (!fs.existsSync(path.join(docs, "out/index.html"))) {
    console.error(
      "apps/docs/out is missing — run `pnpm exec turbo run build --filter=@vegastack/docs`",
    );
    process.exit(2);
  }
  port = await reservePort();
  server = spawn("pnpm", ["exec", "serve", "out", "-l", String(port)], {
    cwd: docs,
    stdio: "ignore",
    detached: true,
  });
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/`);
      if (res.ok) break;
    } catch {}
    await sleep(200);
  }
}
const base = `http://127.0.0.1:${port}`;

const LANES = [
  { id: "320-light-ltr", width: 320, dark: false, rtl: false },
  { id: "768-light-ltr", width: 768, dark: false, rtl: false },
  { id: "1280-light-ltr", width: 1280, dark: false, rtl: false },
  { id: "1280-dark-ltr", width: 1280, dark: true, rtl: false },
  { id: "1280-light-rtl", width: 1280, dark: false, rtl: true },
];

const METRIC_PROPS = [
  "display",
  "position",
  "width",
  "height",
  "minHeight",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "marginTop",
  "marginBottom",
  "gap",
  "rowGap",
  "columnGap",
  "borderRadius",
  "borderTopWidth",
  "borderColor",
  "boxShadow",
  "fontSize",
  "lineHeight",
  "fontWeight",
  "letterSpacing",
  "textTransform",
  "color",
  "backgroundColor",
  "opacity",
  "transitionProperty",
  "transitionDuration",
  "transitionTimingFunction",
  "outlineStyle",
  "outlineWidth",
  "outlineOffset",
  "zIndex",
  "overflowX",
];

const browser = await chromium.launch();
const summary = [];
try {
  for (const route of routes) {
    const name = route.split("/").pop();
    const dir = path.join(outDir, name);
    if (opt.all && fs.existsSync(path.join(dir, "record.json"))) continue; // resume support
    fs.mkdirSync(dir, { recursive: true });
    const record = {
      route,
      previews: [],
      console: [],
      axe: {},
      metrics: {},
      overflow: {},
      focus: [],
    };
    for (const lane of LANES) {
      const ctx = await browser.newContext({
        viewport: { width: lane.width, height: 900 },
        colorScheme: lane.dark ? "dark" : "light",
        reducedMotion: "reduce",
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      page.on("console", (m) => {
        if (m.type() === "error" || m.type() === "warning")
          record.console.push({
            lane: lane.id,
            type: m.type(),
            text: m.text().slice(0, 400),
          });
      });
      page.on("pageerror", (e) =>
        record.console.push({
          lane: lane.id,
          type: "pageerror",
          text: String(e).slice(0, 400),
        }),
      );
      await page.goto(base + route, { waitUntil: "networkidle" });
      await page
        .waitForFunction(
          (dark) =>
            document.documentElement.classList.contains("dark") === dark,
          lane.dark,
          { timeout: 10000 },
        )
        .catch(() => {});
      if (lane.rtl)
        await page.evaluate(() =>
          document.documentElement.setAttribute("dir", "rtl"),
        );
      await sleep(250);

      const previews = page.locator("[data-vrt-preview]");
      const count = await previews.count();
      record.overflow[lane.id] = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      if (lane.id === "1280-light-ltr")
        await page.screenshot({
          path: path.join(dir, "page__1280-light.png"),
          fullPage: true,
        });
      for (let i = 0; i < count; i++) {
        const el = previews.nth(i);
        const pname =
          (await el.getAttribute("data-vrt-preview")) ?? `preview-${i}`;
        if (!record.previews.includes(pname)) record.previews.push(pname);
        await el.scrollIntoViewIfNeeded().catch(() => {});
        await el
          .screenshot({
            path: path.join(dir, `${pname}__${lane.id}.png`),
            animations: "disabled",
          })
          .catch((e) =>
            record.console.push({
              lane: lane.id,
              type: "capture",
              text: `${pname}: ${e.message.slice(0, 200)}`,
            }),
          );
        if (
          lane.id === "1280-light-ltr" ||
          lane.id === "1280-dark-ltr" ||
          lane.id === "320-light-ltr"
        ) {
          record.metrics[`${pname}__${lane.id}`] = await el.evaluate(
            (rootEl, props) => {
              const rows = [];
              const els = [
                rootEl,
                ...rootEl.querySelectorAll(
                  "[data-slot], button, input, textarea, select, a[href], [role]",
                ),
              ];
              for (const e of els.slice(0, 400)) {
                const cs = getComputedStyle(e);
                const r = e.getBoundingClientRect();
                const row = {
                  tag: e.tagName.toLowerCase(),
                  slot: e.getAttribute("data-slot"),
                  role: e.getAttribute("role"),
                  cls: (e.getAttribute("class") ?? "").slice(0, 300),
                  rect: [
                    Math.round(r.width * 10) / 10,
                    Math.round(r.height * 10) / 10,
                  ],
                };
                for (const p of props) row[p] = cs[p];
                rows.push(row);
              }
              return rows;
            },
            METRIC_PROPS,
          );
        }
        if (lane.id === "1280-light-ltr" || lane.id === "1280-dark-ltr") {
          const axe = await el
            .evaluate(async (rootEl, src) => {
              if (!window.axe) {
                const s = document.createElement("script");
                s.textContent = src;
                document.head.appendChild(s);
              }
              const res = await window.axe.run(rootEl, {
                runOnly: {
                  type: "tag",
                  values: ["wcag2a", "wcag2aa", "wcag22aa", "best-practice"],
                },
              });
              return res.violations.map((v) => ({
                id: v.id,
                impact: v.impact,
                help: v.help,
                nodes: v.nodes.slice(0, 5).map((n) => ({
                  target: n.target.join(" "),
                  html: n.html.slice(0, 200),
                })),
              }));
            }, axeSource)
            .catch((e) => [
              { id: "axe-failed", help: String(e).slice(0, 200) },
            ]);
          if (axe.length) record.axe[`${pname}__${lane.id}`] = axe;
        }
      }

      if (opt.focus && lane.id === "1280-light-ltr" && count) {
        const first = previews.first();
        await first.evaluate((e) => e.scrollIntoView({ block: "center" }));
        await page.evaluate(() => {
          const el = document.querySelector("[data-vrt-preview]");
          el.setAttribute("tabindex", "-1");
          el.focus();
        });
        for (let t = 0; t < 8; t++) {
          await page.keyboard.press("Tab");
          const info = await page.evaluate(() => {
            const a = document.activeElement;
            if (!a || a === document.body) return null;
            const inside = !!a.closest("[data-vrt-preview]");
            const cs = getComputedStyle(a);
            return {
              tag: a.tagName.toLowerCase(),
              slot: a.getAttribute("data-slot"),
              text: (a.textContent ?? "").trim().slice(0, 40),
              inside,
              focusVisible: a.matches(":focus-visible"),
              outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} offset ${cs.outlineOffset}`,
              boxShadow: cs.boxShadow,
              borderColor: cs.borderColor,
            };
          });
          if (!info || !info.inside) break;
          record.focus.push(info);
          await first
            .screenshot({
              path: path.join(dir, `focus-${t}__1280-light.png`),
              animations: "disabled",
            })
            .catch(() => {});
        }
      }
      await ctx.close();
    }
    fs.writeFileSync(
      path.join(dir, "record.json"),
      JSON.stringify(record, null, 2),
    );
    const axeCount = Object.values(record.axe).reduce(
      (n, v) => n + v.length,
      0,
    );
    const overflow = Object.entries(record.overflow)
      .filter(([, o]) => o.scrollWidth > o.clientWidth + 1)
      .map(([k]) => k);
    summary.push({
      route: name,
      previews: record.previews.length,
      axe: axeCount,
      consoleIssues: record.console.length,
      overflow,
      tabStops: record.focus.length,
      focusVisibleMissing: record.focus.filter(
        (f) =>
          f.focusVisible &&
          f.outline.startsWith("none") &&
          f.boxShadow === "none",
      ).length,
    });
    console.log(
      `${name}: previews=${record.previews.length} axe=${axeCount} console=${record.console.length} overflow=${overflow.join("|") || "-"} tabs=${record.focus.length}`,
    );
  }
} finally {
  await browser.close();
  if (server)
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
}
fs.writeFileSync(
  path.join(outDir, `summary-${Date.now()}.json`),
  JSON.stringify(summary, null, 2),
);

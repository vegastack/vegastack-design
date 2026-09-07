// Micro-detail state probe: hover / active / focus-visible on every visible interactive element
// inside every `[data-vrt-preview]` fixture, at 2× device scale. Records computed styles at rest,
// hover, active and focus, flags geometry defects a static capture cannot show, and writes a
// zoomed crop for every flagged element so a human can confirm.
//
// Flags:
//   hover-touches-border   hover fill changes and the element edge sits on an ancestor's border
//   hover-invisible        hover changes nothing visible (bg/color/border/opacity/underline)
//   hover-layout-shift     the element's box changes size on hover
//   radius-mismatch        element hugs a rounded ancestor corner with an inconsistent inner radius
//   focus-clipped          focus outline is offset outward but an overflow-hidden ancestor clips it
//   focus-none             keyboard focus produces no outline, no border change, no box-shadow
//   active-same-as-hover   pressing changes nothing beyond hover (no pressed step)
//
//   node tooling/audit/probe-states.mjs --routes tabs,button   # or --all
//   --port <n>  reuse a running `serve out`
//   --out <dir> write elsewhere (default `.audit/_states`, or $AUDIT_OUT_DIR)

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
const text = fs.readFileSync(
  path.join(docs, "vrt/contract-routes.generated.ts"),
  "utf8",
);
const grab = (name) =>
  [
    ...text.matchAll(
      new RegExp(`export const ${name} = \\[([^\\]]*)\\]`, "gs"),
    ),
  ][0]?.[1]
    ?.match(/"[^"]+"/g)
    ?.map((s) => s.slice(1, -1)) ?? [];
const allRoutes = [...grab("COMPONENT_ROUTES"), ...grab("BLOCK_ROUTES")];

const args = process.argv.slice(2);
const opt = { routes: null, all: false, port: null, dark: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === "--all") opt.all = true;
  else if (a === "--routes")
    opt.routes = args[++i]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  else if (a === "--port") opt.port = Number(args[++i]);
  else if (a === "--dark") opt.dark = true;
}
const routes = opt.all
  ? allRoutes
  : (opt.routes ?? []).map((r) =>
      r.startsWith("/") ? r : `/docs/components/${r}`,
    );
if (!routes.length) {
  console.error("pass --all or --routes a,b");
  process.exit(2);
}

const outDir = evidenceDir("_states" + (opt.dark ? "-dark" : ""));

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
  port = await reservePort();
  server = spawn("pnpm", ["exec", "serve", "out", "-l", String(port)], {
    cwd: docs,
    stdio: "ignore",
    detached: true,
  });
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`http://127.0.0.1:${port}/`)).ok) break;
    } catch {}
    await sleep(200);
  }
}
const base = `http://127.0.0.1:${port}`;

const SELECTOR = [
  "button",
  "a[href]",
  "[role=tab]",
  "[role=menuitem]",
  "[role=option]",
  "[role=button]",
  "[role=checkbox]",
  "[role=radio]",
  "[role=switch]",
  "[role=row]",
  "tbody tr",
  "input",
  "textarea",
  "select",
  "summary",
  "[tabindex='0']",
  "[data-slot$=trigger]",
  "[data-slot$=item]",
  "[data-slot=sidebar-menu-button]",
  "li[data-slot]",
].join(",");

// Runs in the page: collect candidate elements inside a preview, deduped by visual signature.
const collectFn = (previewIndex) => {
  const preview = document.querySelectorAll("[data-vrt-preview]")[previewIndex];
  if (!preview) return [];
  const els = [...preview.querySelectorAll(window.__SEL)];
  const seen = new Map();
  const out = [];
  let idx = 0;
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    const cs = getComputedStyle(el);
    if (
      cs.visibility === "hidden" ||
      cs.display === "none" ||
      cs.pointerEvents === "none"
    )
      continue;
    if (el.closest("[aria-hidden=true]")) continue;
    const sig = `${el.tagName}|${el.getAttribute("role") ?? ""}|${el.getAttribute("data-slot") ?? ""}|${el.className?.toString().slice(0, 80)}|${el.parentElement?.tagName}`;
    const n = (seen.get(sig) ?? 0) + 1;
    seen.set(sig, n);
    if (n > 2) continue;
    el.setAttribute("data-probe-id", `p${previewIndex}-${idx}`);
    out.push({
      id: `p${previewIndex}-${idx}`,
      sig,
      tag: el.tagName.toLowerCase(),
      role: el.getAttribute("role"),
      slot: el.getAttribute("data-slot"),
      text: (el.textContent || "").trim().slice(0, 40),
    });
    idx++;
    if (idx >= 14) break;
  }
  return out;
};

// Runs in the page: computed snapshot + geometry relations for one element.
const snapshotFn = (id) => {
  const el = document.querySelector(`[data-probe-id="${id}"]`);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const pick = [
    "backgroundColor",
    "color",
    "borderTopColor",
    "borderBottomColor",
    "borderTopWidth",
    "borderBottomWidth",
    "outlineStyle",
    "outlineWidth",
    "outlineOffset",
    "outlineColor",
    "boxShadow",
    "opacity",
    "textDecorationLine",
    "borderRadius",
    "borderTopLeftRadius",
    "borderBottomLeftRadius",
    "cursor",
    "transform",
  ];
  const style = Object.fromEntries(pick.map((p) => [p, cs[p]]));
  // ancestors (up to 5) with border or overflow or radius, and where our edges sit relative to them
  const rel = [];
  let a = el.parentElement;
  let depth = 0;
  while (a && depth < 5 && a !== document.body) {
    const acs = getComputedStyle(a);
    const ar = a.getBoundingClientRect();
    const bw = {
      top: parseFloat(acs.borderTopWidth),
      bottom: parseFloat(acs.borderBottomWidth),
      left: parseFloat(acs.borderLeftWidth),
      right: parseFloat(acs.borderRightWidth),
    };
    const touch = {
      top: Math.abs(r.top - (ar.top + bw.top)) <= 1,
      bottom: Math.abs(r.bottom - (ar.bottom - bw.bottom)) <= 1,
      left: Math.abs(r.left - (ar.left + bw.left)) <= 1,
      right: Math.abs(r.right - (ar.right - bw.right)) <= 1,
    };
    rel.push({
      depth,
      tag: a.tagName.toLowerCase(),
      slot: a.getAttribute("data-slot"),
      bw,
      touch,
      overflow: acs.overflow,
      radius: parseFloat(acs.borderTopLeftRadius),
      padding: parseFloat(acs.paddingLeft),
      hasBg: acs.backgroundColor !== "rgba(0, 0, 0, 0)",
    });
    a = a.parentElement;
    depth++;
  }
  // sibling border below/above (e.g. tablist border on the list vs trigger) is covered by ancestors; also check the next/prev sibling hairline
  return {
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    style,
    rel,
    radius: parseFloat(cs.borderTopLeftRadius),
  };
};

const browser = await chromium.launch();
const index = [];
try {
  for (const route of routes) {
    const name = route.split("/").pop();
    const dir = path.join(outDir, name);
    if (opt.all && fs.existsSync(path.join(dir, "states.json"))) continue;
    fs.mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: opt.dark ? "dark" : "light",
      reducedMotion: "reduce",
      deviceScaleFactor: 2,
    });
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: "networkidle" });
    await page
      .waitForFunction(
        (dark) => document.documentElement.classList.contains("dark") === dark,
        opt.dark,
        { timeout: 10000 },
      )
      .catch(() => {});
    await page.evaluate((sel) => {
      window.__SEL = sel;
    }, SELECTOR);
    await sleep(200);
    const previewCount = await page.locator("[data-vrt-preview]").count();
    const record = { route, elements: [] };
    let crops = 0;
    for (let p = 0; p < previewCount; p++) {
      await page
        .locator("[data-vrt-preview]")
        .nth(p)
        .scrollIntoViewIfNeeded()
        .catch(() => {});
      const els = await page.evaluate(collectFn, p);
      for (const e of els) {
        const loc = page.locator(`[data-probe-id="${e.id}"]`);
        try {
          await loc.scrollIntoViewIfNeeded({ timeout: 2000 });
          await page.mouse.move(0, 0);
          await sleep(60);
          const rest = await page.evaluate(snapshotFn, e.id);
          if (!rest) continue;
          await loc.hover({ timeout: 2000, force: true });
          await sleep(120);
          const hover = await page.evaluate(snapshotFn, e.id);
          await page.mouse.down();
          await sleep(80);
          const active = await page.evaluate(snapshotFn, e.id);
          await page.mouse.up();
          await sleep(60);
          // keyboard focus: focus programmatically then dispatch a keydown so :focus-visible applies
          await page.evaluate((id) => {
            const el = document.querySelector(`[data-probe-id="${id}"]`);
            el?.focus({ preventScroll: true });
          }, e.id);
          await page.keyboard.press("Shift");
          await sleep(80);
          const focus = await page.evaluate(snapshotFn, e.id);
          await page.mouse.move(0, 0);
          await page.evaluate(() => document.activeElement?.blur?.());
          await sleep(60);

          const flags = [];
          const same = (a, b, k) => a.style[k] === b.style[k];
          const hoverVisible =
            hover &&
            !(
              same(rest, hover, "backgroundColor") &&
              same(rest, hover, "color") &&
              same(rest, hover, "borderTopColor") &&
              same(rest, hover, "opacity") &&
              same(rest, hover, "textDecorationLine") &&
              same(rest, hover, "boxShadow")
            );
          const interactive =
            ["button", "a", "input", "textarea", "select", "summary"].includes(
              e.tag,
            ) || !!e.role;
          if (
            interactive &&
            !hoverVisible &&
            rest.style.cursor !== "default" &&
            !["input", "textarea", "select"].includes(e.tag)
          )
            flags.push("hover-invisible");
          if (hover && !same(rest, hover, "backgroundColor")) {
            for (const a of hover.rel) {
              const sides = ["top", "bottom", "left", "right"].filter(
                (s) => a.bw[s] > 0 && a.touch[s],
              );
              if (sides.length)
                flags.push(
                  `hover-touches-border:${a.tag}${a.slot ? "[" + a.slot + "]" : ""}:${sides.join("+")}`,
                );
            }
          }
          if (
            hover &&
            (Math.abs(hover.rect.w - rest.rect.w) > 0.5 ||
              Math.abs(hover.rect.h - rest.rect.h) > 0.5)
          )
            flags.push("hover-layout-shift");
          // radius: element hugging a rounded ancestor corner
          for (const a of rest.rel) {
            if (a.radius > 2 && rest.radius >= 0) {
              const corner =
                (a.touch.top && a.touch.left) ||
                (a.touch.bottom && a.touch.left) ||
                (a.touch.top && a.touch.right) ||
                (a.touch.bottom && a.touch.right);
              if (
                corner &&
                a.overflow !== "hidden" &&
                Math.abs(rest.radius - a.radius) > 1.5 &&
                rest.style.backgroundColor !== "rgba(0, 0, 0, 0)"
              )
                flags.push(
                  `radius-mismatch:${rest.radius}vs${a.radius}@${a.tag}${a.slot ? "[" + a.slot + "]" : ""}`,
                );
              if (
                corner &&
                a.overflow !== "hidden" &&
                hover &&
                !same(rest, hover, "backgroundColor") &&
                Math.abs(hover.radius - a.radius) > 1.5
              )
                flags.push(
                  `hover-radius-mismatch:${hover.radius}vs${a.radius}@${a.tag}${a.slot ? "[" + a.slot + "]" : ""}`,
                );
            }
          }
          if (focus) {
            const ow = parseFloat(focus.style.outlineWidth) || 0;
            const oo = parseFloat(focus.style.outlineOffset) || 0;
            const hasOutline = focus.style.outlineStyle !== "none" && ow > 0;
            const focusVisible =
              hasOutline ||
              !same(rest, focus, "borderTopColor") ||
              !same(rest, focus, "boxShadow") ||
              !same(rest, focus, "backgroundColor");
            if (
              interactive &&
              !focusVisible &&
              e.tag !== "tr" &&
              e.role !== "row"
            )
              flags.push("focus-none");
            if (hasOutline && oo > 0) {
              const clipper = focus.rel.find(
                (a) =>
                  (a.overflow === "hidden" ||
                    a.overflow === "auto" ||
                    a.overflow === "clip") &&
                  (a.touch.top ||
                    a.touch.bottom ||
                    a.touch.left ||
                    a.touch.right),
              );
              if (clipper)
                flags.push(
                  `focus-clipped:${clipper.tag}${clipper.slot ? "[" + clipper.slot + "]" : ""}`,
                );
            }
          }
          if (
            hover &&
            active &&
            hoverVisible &&
            same(hover, active, "backgroundColor") &&
            same(hover, active, "transform") &&
            same(hover, active, "opacity") &&
            same(hover, active, "color") &&
            (e.tag === "button" || e.role === "tab" || e.role === "button")
          )
            flags.push("active-same-as-hover");

          const entry = {
            ...e,
            preview: p,
            flags,
            rest: rest.style,
            hover: hover?.style,
            active: active?.style,
            focus: focus?.style,
            rect: rest.rect,
          };
          if (flags.length && crops < 10) {
            await loc.hover({ timeout: 2000, force: true });
            await sleep(120);
            const r = rest.rect;
            const pad = 14;
            const vp = page.viewportSize();
            const clip = {
              x: Math.max(0, r.x - pad),
              y: Math.max(0, r.y - pad),
              width: Math.min(vp.width, r.w + pad * 2),
              height: Math.min(vp.height, r.h + pad * 2),
            };
            const scroll = await page.evaluate(() => ({
              x: window.scrollX,
              y: window.scrollY,
            }));
            const file = `${e.id}__hover.png`;
            await page
              .screenshot({
                path: path.join(dir, file),
                clip: { ...clip, x: clip.x + scroll.x, y: clip.y + scroll.y },
                fullPage: true,
              })
              .catch(() => {});
            entry.crop = file;
            crops++;
            await page.mouse.move(0, 0);
          }
          record.elements.push(entry);
        } catch (err) {
          record.elements.push({
            ...e,
            preview: p,
            flags: ["probe-error"],
            error: String(err).slice(0, 120),
          });
        }
      }
    }
    fs.writeFileSync(
      path.join(dir, "states.json"),
      JSON.stringify(record, null, 1),
    );
    const flagged = record.elements.filter(
      (x) => x.flags.length && !x.flags.includes("probe-error"),
    );
    index.push({
      route: name,
      elements: record.elements.length,
      flagged: flagged.length,
      flags: flagged.map(
        (f) =>
          `${f.id} ${f.tag}${f.slot ? "[" + f.slot + "]" : ""} "${f.text}" → ${f.flags.join(", ")}`,
      ),
    });
    console.log(
      `${name}: ${record.elements.length} probed, ${flagged.length} flagged`,
    );
    await ctx.close();
  }
} finally {
  await browser.close();
  if (server)
    try {
      process.kill(-server.pid);
    } catch {}
}
const prev = fs.existsSync(path.join(outDir, "index.json"))
  ? JSON.parse(fs.readFileSync(path.join(outDir, "index.json"), "utf8"))
  : [];
const merged = [
  ...prev.filter((p) => !index.some((i) => i.route === p.route)),
  ...index,
];
fs.writeFileSync(
  path.join(outDir, "index.json"),
  JSON.stringify(merged, null, 1),
);

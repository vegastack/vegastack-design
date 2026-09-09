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
//   node docs/audits/2026-09-07-system-audit/probe-states.mjs --routes tabs,button   # or --all
//   --port <n>  reuse a running `serve out`
//   --list      print the contract routes it would probe, and exit

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const root = path.resolve(import.meta.dirname, "../../..");
const docs = path.join(root, "apps/docs");
const { chromium } = await import("playwright");
// Routes come straight from the machine authority, `packages/ui/component-contracts.json`
// (`docsSlug` per record). It used to read `apps/docs/vrt/contract-routes.generated.ts`, a build
// output that nothing generates any more — the contract and pixel lanes that consumed it were
// deleted with the attestation stack, and so was the generator's entry for it. The contract is one
// hop closer to the authority and cannot go stale.
const contracts = JSON.parse(
  fs.readFileSync(
    path.join(root, "packages/ui/component-contracts.json"),
    "utf8",
  ),
);
const COMPONENT_ROUTES = contracts.components
  .map((record) => record.docsSlug)
  .sort();
const BLOCK_ROUTES = contracts.blocks.map((record) => record.docsSlug).sort();
const allRoutes = [...COMPONENT_ROUTES, ...BLOCK_ROUTES];

const args = process.argv.slice(2);
const opt = { routes: null, all: false, port: null, dark: false, list: false };
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
  else if (a === "--list" || a === "--help" || a === "-h") opt.list = true;
}
if (opt.list) {
  console.log(
    `probe-states: ${allRoutes.length} contract routes (${COMPONENT_ROUTES.length} components + ${BLOCK_ROUTES.length} blocks)`,
  );
  for (const route of allRoutes) console.log(`  ${route}`);
  process.exit(0);
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

const outDir = path.join(
  import.meta.dirname,
  "captures",
  "_states" + (opt.dark ? "-dark" : ""),
);
fs.mkdirSync(outDir, { recursive: true });

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

/** Roles that name a control the pointer can act on — see `interactive` below. */
const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "checkbox",
  "radio",
  "switch",
  "tab",
  "menuitem",
  "menuitemcheckbox",
  "menuitemradio",
  "option",
  "combobox",
  "slider",
  "spinbutton",
  "textbox",
  "searchbox",
  "treeitem",
  "row",
]);

/**
 * Containers that `[tabindex='0']` drags in. A tab panel and a scroll region are focusable so a
 * keyboard user can reach their content — they are not controls, they have no hover state to
 * miss, and an INACTIVE panel never becomes scroll-visible, which timed Playwright out and
 * reported five `probe-error`s per Tabs page.
 */
const NON_CONTROL_SELECTOR =
  "[role=tabpanel], [role=region], [role=group], [role=list], [role=presentation], [role=none]";

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
    if (el.matches(window.__NON_CONTROL)) continue;
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
  // The system's hover wash is frequently painted on an INSET CHILD, not on the control itself —
  // that is the SP-02 recipe ("a wash is inset >=4px from a container hairline"), and NumberField's
  // steppers, Tabs' triggers and every `group/wash` control use it. Reading only the element's own
  // computed style therefore reported a working hover as `hover-invisible`. Fold the first few
  // descendants' fill and ink into the comparison so an inset chip counts as a visible change.
  const descendants = [...el.querySelectorAll("*")].slice(0, 8);
  style.descendantPaint = descendants
    .map((node) => {
      const ncs = getComputedStyle(node);
      return `${ncs.backgroundColor}/${ncs.color}/${ncs.opacity}`;
    })
    .join("|");
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
      rect: { w: ar.width, h: ar.height },
      // A text-entry control's focus affordance is a BORDER TINT ON THE GROUP, not an outline on
      // the input (design.md — the ring would be clipped by the group's `overflow-hidden`, which is
      // why the tint exists). Record what the ancestor paints so `focus-none` can see it; reading
      // only the input reported every `fieldControlGroup` field as having no focus indicator.
      paint: `${acs.borderTopColor}/${acs.boxShadow}/${acs.outlineStyle}`,
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
    // Did THIS element open a popup? A trigger's open state legitimately carries the hover tone
    // (Base UI paints `data-popup-open` with the same wash), so a press that opens a menu is not a
    // missing pressed step. Read from the element, not the document, so a stray open surface
    // elsewhere cannot mask a real defect.
    expanded:
      el.getAttribute("aria-expanded") === "true" ||
      el.hasAttribute("data-popup-open") ||
      el.hasAttribute("data-open"),
    // The current page / step / tab is deliberately inert to hover in several components
    // (`PaginationLink` pins `hover:bg-primary` on the active page on purpose — you are already
    // there). Marked here so `hover-invisible` can honour that rather than re-reporting it.
    current: el.hasAttribute("aria-current"),
  };
};

/**
 * Close anything the previous element's press opened. Every dropdown, select, combobox and
 * split-button trigger opens a surface on pointer-down, and a live overlay sits ON TOP of the next
 * element the probe wants to hover — so the pointer lands on the popup and the "hover" reading is
 * just the resting style again. Escape closes every Base UI surface; the poll is what makes this a
 * measurement rather than a hope, and a surface that refuses to close is reported instead of
 * silently poisoning the rest of the route.
 */
// What counts as "open". NOT `[data-slot$='content']`: `FloatingSurface` names a popup
// `<slot>-content`, but so are a dozen STATIC parts (`tabs-content`, `accordion-content`,
// `card-content`), and a selector that matches those reports ten permanently-open overlays on a
// page that has none. A floating surface is identifiable by its POSITIONER, which Base UI mounts
// only while the surface is open — plus the modal roles, which are portalled without one.
const OPEN_OVERLAY_SELECTOR =
  "[data-slot$='-positioner'], [role=dialog], [role=alertdialog], [role=menu], [role=listbox]";
async function dismissOverlays(page) {
  const open = () =>
    page.evaluate(
      (sel) =>
        [...document.querySelectorAll(sel)].filter(
          (el) => el.getBoundingClientRect().width > 0,
        ).length,
      OPEN_OVERLAY_SELECTOR,
    );
  for (let attempt = 0; attempt < 3; attempt++) {
    if ((await open()) === 0) return true;
    await page.keyboard.press("Escape");
    await sleep(120);
  }
  const left = await open();
  if (left) console.warn(`  ! ${left} overlay(s) would not dismiss`);
  return left === 0;
}

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
    await page.evaluate(
      ([sel, nonControl]) => {
        window.__SEL = sel;
        window.__NON_CONTROL = nonControl;
      },
      [SELECTOR, NON_CONTROL_SELECTOR],
    );
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
          // The press above OPENS a menu/popover on every dropdown, select and split-button
          // trigger, and nothing used to close it — so the NEXT element was hovered underneath a
          // live overlay, the pointer landed on the popup instead of the control, and its `hover`
          // snapshot came back identical to `rest`. That is the entire "SplitButton's primary half
          // has no hover" finding of 2026-09-07: 10 of 12 primaries were measured through an open
          // menu, and the two that read correctly were the two whose predecessor happened not to
          // open one. Dismiss before moving on, and verify it actually closed.
          await dismissOverlays(page);
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
              same(rest, hover, "boxShadow") &&
              same(rest, hover, "descendantPaint")
            );
          // A ROLE ALLOWLIST, not "has a role at all". `[tabindex='0']` sweeps focusable
          // NON-controls into the collection — a `role="tabpanel"` is the common one — and treating
          // those as controls demanded a hover state from a panel. Only roles that name something
          // pressable, checkable or selectable qualify.
          const interactive =
            ["button", "a", "input", "textarea", "select", "summary"].includes(
              e.tag,
            ) || INTERACTIVE_ROLES.has(e.role ?? "");
          // An element that paints nothing (an `opacity: 0` native <select> stretched over a
          // styled caption, for instance) has no visual state to get wrong — every paint flag
          // below is meaningless on it.
          const paints = parseFloat(rest.style.opacity) > 0;
          if (
            interactive &&
            paints &&
            !hoverVisible &&
            !rest.current &&
            rest.style.cursor !== "default" &&
            !["input", "textarea", "select"].includes(e.tag)
          )
            flags.push("hover-invisible");
          if (paints && hover && !same(rest, hover, "backgroundColor")) {
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
          // radius: element hugging a rounded ancestor corner.
          //
          // A FULLY ROUNDED box is excluded on both sides. `rounded-full` compiles to
          // `border-radius: calc(infinity * 1px)`, which computes to a clamped multi-million-pixel
          // value (33554400 in Chromium) — comparing that against a child's 8px radius produced
          // `hover-radius-mismatch:8vs33554400` on every pill in the system (Bubble was the
          // standing example). A pill's corner is a semicircle: a child inside it is not "hugging a
          // corner with the wrong inner radius", there is no shared corner to match. Treat any
          // radius at or above half the box's short side as a pill and skip the comparison.
          const isPill = (radius, box) =>
            radius >= Math.min(box.w, box.h) / 2 - 0.5;
          for (const a of rest.rel) {
            if (isPill(a.radius, a.rect ?? rest.rect)) continue;
            if (paints && a.radius > 2 && rest.radius >= 0) {
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
            const ancestorFocusPaint = focus.rel.some(
              (a, i) => a.paint !== rest.rel[i]?.paint,
            );
            const focusVisible =
              hasOutline ||
              !same(rest, focus, "borderTopColor") ||
              !same(rest, focus, "boxShadow") ||
              !same(rest, focus, "backgroundColor") ||
              ancestorFocusPaint;
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
            same(hover, active, "descendantPaint") &&
            same(hover, active, "transform") &&
            same(hover, active, "opacity") &&
            same(hover, active, "color") &&
            (e.tag === "button" || e.role === "tab" || e.role === "button") &&
            // …unless the press OPENED something. A menu/select/popover trigger is styled by its
            // `data-popup-open` state, which carries the hover tone by design, so "pressed looks
            // like hovered" is the intended reading of an open trigger — not a missing rung.
            !active.expanded
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

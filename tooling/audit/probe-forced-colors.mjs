// Forced-colors focus probe: does a focused text-entry control paint ANY indicator when the
// authored border tint is erased by the forced palette?
//
//   node tooling/audit/probe-forced-colors.mjs   [--out <dir>]
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { ROOT as root } from "../lib/fs.mjs";
import { evidenceDir } from "./out-dir.mjs";
const docs = path.join(root, "apps/docs");
const { chromium } = createRequire(path.join(docs, "package.json"))(
  "@playwright/test",
);
const port = await new Promise((ok) => {
  const p = createServer();
  p.listen(0, "127.0.0.1", () => {
    const { port } = p.address();
    p.close(() => ok(port));
  });
});
const server = spawn("pnpm", ["exec", "serve", "out", "-l", String(port)], {
  cwd: docs,
  stdio: "ignore",
  detached: true,
});
// POLL for readiness, never sleep a fixed interval. A 1500ms sleep was enough on an idle
// machine and not enough on a loaded one — `serve` had not bound the port yet and the first
// `page.goto` died with ERR_CONNECTION_REFUSED, which reads as a broken probe rather than a slow
// one. Reproduced 2026-09-07 while sibling gate runs were saturating the box.
const sleep = (ms) => new Promise((d) => setTimeout(d, ms));
let ready = false;
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(`http://127.0.0.1:${port}/`)).ok) {
      ready = true;
      break;
    }
  } catch {}
  await sleep(200);
}
if (!ready) {
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {}
  console.error(
    `could not reach the docs server on 127.0.0.1:${port} after 10s — is \`apps/docs/out\` built? ` +
      "(`pnpm exec turbo run build --filter=@vegastack/docs`)",
  );
  process.exit(2);
}
const browser = await chromium.launch();
const ctx = await browser.newContext({
  forcedColors: "active",
  colorScheme: "light",
  viewport: { width: 1280, height: 900 },
});
const page = await ctx.newPage();
const routes = {
  input: "input",
  textarea: "textarea",
  "otp-input-slot": "otp-input",
  "number-field-input": "number-field",
  "field-control": "field",
  "select-trigger": "select",
  "combobox-input": "combobox",
  "chip-input": "chip-input",
  "password-input": "password-input",
  "date-picker-trigger": "date-picker",
  search: "command",
  "text-edit": "text-edit",
  "auto-save-input": "auto-save-input",
  "textarea-sm": "textarea",
};
const out = [];
for (const [slot, route] of Object.entries(routes)) {
  await page.goto(`http://127.0.0.1:${port}/docs/components/${route}`, {
    waitUntil: "networkidle",
  });
  const res = await page.evaluate((slot) => {
    const root = document.querySelector("[data-vrt-preview]");
    const el = root?.querySelector(
      `[data-slot="${slot}"] input, [data-slot="${slot}"] textarea, [data-slot="${slot}"][contenteditable], input[data-slot="${slot}"], textarea[data-slot="${slot}"], [data-slot="${slot}"]`,
    );
    if (!el) return { slot, found: false };
    el.focus();
    const cs = getComputedStyle(el);
    const before = getComputedStyle(el, "::before");
    const wrapper = el.closest(
      "[data-slot$='group'], [data-slot='number-field'], [data-slot='text-edit'], [data-slot='chip-input']",
    );
    const wcs = wrapper ? getComputedStyle(wrapper) : null;
    return {
      slot,
      found: true,
      tag: el.tagName,
      focused: document.activeElement === el,
      fv: el.matches(":focus-visible"),
      outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`,
      border: `${cs.borderStyle} ${cs.borderTopWidth} ${cs.borderColor}`,
      boxShadow: cs.boxShadow,
      wrapperOutline: wcs ? `${wcs.outlineStyle} ${wcs.outlineWidth}` : null,
      wrapperBorder: wcs ? wcs.borderColor : null,
    };
  }, slot);
  out.push(res);
  console.log(JSON.stringify(res));
}
await page.goto(`http://127.0.0.1:${port}/docs/components/input`, {
  waitUntil: "networkidle",
});
await page.evaluate(() =>
  document.querySelector("[data-vrt-preview] input")?.focus(),
);
await page
  .locator("[data-vrt-preview]")
  .first()
  .screenshot({
    path: path.join(evidenceDir(), "probe-forced-colors-input-focused.png"),
  });
fs.writeFileSync(
  path.join(evidenceDir(), "probe-forced-colors.json"),
  JSON.stringify(out, null, 2),
);
await browser.close();
try {
  process.kill(-server.pid, "SIGTERM");
} catch {}

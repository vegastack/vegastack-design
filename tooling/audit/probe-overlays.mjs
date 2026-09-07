// Opens each overlay component in its docs preview and screenshots the OPEN state (light + dark).
//
//   node tooling/audit/probe-overlays.mjs
//   --out <dir>  write elsewhere (default `.audit/_overlays`, or $AUDIT_OUT_DIR)
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
const out = evidenceDir("_overlays");
const browser = await chromium.launch();
// [route, preview, action]
const cases = [
  ["dropdown-menu", "dropdownMenuRich", "click"],
  ["context-menu", "contextMenuRich", "rightclick"],
  ["select", "selectStates", "click:last"],
  ["combobox", "comboboxGroups", "focus"],
  ["command", "commandDialog", "click"],
  ["dialog", "dialogSizes", "click:2"],
  ["alert-dialog", "alertDialogIntents", "click"],
  ["sheet", "sheetSides", "click"],
  ["popover", "popoverForm", "click"],
  ["hover-card", "hoverCardSides", "hover"],
  ["tooltip", "tooltipSides", "hover"],
  ["toast", "sonnerVariants", "click:all"],
  ["date-picker", "datePicker", "click"],
  ["color-picker", "colorPicker", "click"],
  ["emoji-picker", "emojiPicker", "click"],
  ["country-select", "countrySelect", "click"],
];
const results = [];
for (const dark of [false, true]) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: dark ? "dark" : "light",
    reducedMotion: "reduce",
    deviceScaleFactor: 2,
  });
  for (const [route, preview, action] of cases) {
    const page = await ctx.newPage();
    try {
      await page.goto(`http://127.0.0.1:${port}/docs/components/${route}`, {
        waitUntil: "networkidle",
      });
      let fixture = page.locator(`[data-vrt-preview="${preview}"]`).first();
      if (!(await fixture.count()))
        fixture = page.locator("[data-vrt-preview]").first();
      await fixture.evaluate((e) => e.scrollIntoView({ block: "center" }));
      const triggers = fixture.locator(
        "button, [role=combobox], input, [data-slot$='trigger'], [data-slot=context-menu-trigger]",
      );
      const n = await triggers.count();
      const pick = action.endsWith(":last")
        ? triggers.nth(n - 1)
        : action.includes(":2")
          ? triggers.nth(2)
          : triggers.first();
      if (action.startsWith("click:all")) {
        for (let i = 0; i < Math.min(n, 4); i++) {
          await triggers.nth(i).click();
          await page.waitForTimeout(150);
        }
      } else if (action.startsWith("click")) await pick.click();
      else if (action === "rightclick")
        await fixture
          .locator("[data-slot=context-menu-trigger], *")
          .first()
          .click({ button: "right" });
      else if (action === "hover") await pick.hover();
      else if (action === "focus") {
        await pick.click();
        await page.keyboard.press("ArrowDown");
      }
      await page.waitForTimeout(500);
      const info = await page.evaluate(() => {
        const sel =
          "[data-slot$='content'], [data-slot=sheet-content], [data-sonner-toast], [data-slot=command]";
        const els = [...document.querySelectorAll(sel)].filter(
          (e) => e.getBoundingClientRect().width > 0,
        );
        return els.slice(0, 3).map((e) => {
          const cs = getComputedStyle(e);
          const r = e.getBoundingClientRect();
          return {
            slot: e.getAttribute("data-slot") ?? e.tagName,
            rect: [Math.round(r.width), Math.round(r.height)],
            pad: [cs.paddingTop, cs.paddingRight],
            radius: cs.borderRadius,
            shadow: cs.boxShadow.slice(0, 60),
            bg: cs.backgroundColor,
            border: cs.borderColor,
            font: cs.fontSize,
          };
        });
      });
      const name = `${route}__${dark ? "dark" : "light"}.png`;
      await page.screenshot({ path: path.join(out, name), fullPage: false });
      results.push({ route, dark, info });
      console.log(route, dark ? "dark" : "light", JSON.stringify(info));
    } catch (e) {
      console.log(route, "ERR", e.message.slice(0, 120));
    }
    await page.close();
  }
  await ctx.close();
}
fs.writeFileSync(
  path.join(out, "results.json"),
  JSON.stringify(results, null, 2),
);
await browser.close();
try {
  process.kill(-server.pid, "SIGTERM");
} catch {}

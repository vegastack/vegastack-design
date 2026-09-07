// Opens each overlay component in its docs preview and screenshots the OPEN state (light + dark).
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
const root = path.resolve(import.meta.dirname, "../../..");
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
await new Promise((r) => setTimeout(r, 1500));
const out = path.join(import.meta.dirname, "captures", "_overlays");
fs.mkdirSync(out, { recursive: true });
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
// ---------------------------------------------------------------------------------------------
// D11 motion pass (added for O1, audit #40). The two passes above deliberately run under
// `reducedMotion: "reduce"` so the screenshots are deterministic — which also means they can say
// NOTHING about transition timing. This pass re-opens each overlay with motion ENABLED and reads
// the popup's computed `transition-duration` / `transition-timing-function`, so the D11 claim
// (150ms every floating surface, 200ms NavigationMenu and the modal family) is measured rather
// than asserted.
const motion = [];
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    colorScheme: "light",
    reducedMotion: "no-preference",
    deviceScaleFactor: 1,
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
      if (action === "rightclick")
        await fixture
          .locator("[data-slot=context-menu-trigger], *")
          .first()
          .click({ button: "right" });
      else if (action === "hover") await pick.hover();
      else if (action === "focus") {
        await pick.click();
        await page.keyboard.press("ArrowDown");
      } else await pick.click();
      await page.waitForTimeout(600);
      const read = await page.evaluate(() => {
        const sel =
          "[data-slot$='content'], [data-slot=sheet-content], [data-sonner-toast], [data-slot=command]";
        return [...document.querySelectorAll(sel)]
          .filter((e) => e.getBoundingClientRect().width > 0)
          .slice(0, 2)
          .map((e) => {
            const cs = getComputedStyle(e);
            return {
              slot: e.getAttribute("data-slot") ?? e.tagName,
              duration: cs.transitionDuration,
              easing: cs.transitionTimingFunction,
              padTop: cs.paddingTop,
            };
          });
      });
      motion.push({ route, read });
      console.log("MOTION", route, JSON.stringify(read));
    } catch (e) {
      console.log("MOTION", route, "ERR", e.message.slice(0, 120));
    }
    await page.close();
  }
  await ctx.close();
}

fs.writeFileSync(
  path.join(out, "results.json"),
  JSON.stringify({ surfaces: results, motion }, null, 2),
);
await browser.close();
try {
  process.kill(-server.pid, "SIGTERM");
} catch {}

import { test, expect } from "@playwright/test";
import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { BLOCK_ROUTES, COMPONENT_ROUTES } from "./contract-routes.generated";
import { ANIMATED_ICON_CHUNK_COUNT } from "./icon-chunks.generated";

// Visual-regression baseline over every showcase page (real shipped source). Deterministic snapshots
// require the digest-pinned Playwright Docker image (`mcr.microsoft.com/playwright:v1.61.0-noble`)
// for font
// determinism — mac-generated PNGs fail `ubuntu-latest` CI on rendering deltas. Baselines are produced
// by the `update_baselines` run of .github/workflows/vrt.yml and committed once (an MK CI action).
//
// This suite AUTO-ENABLES the moment those baselines are committed: `hasBaselines` checks the
// Playwright snapshot dir, so there is no hard `describe.skip` to remember to flip. It ALSO runs in
// BOOTSTRAP mode (`VRT_UPDATE=1`, set by vrt.yml's update_baselines step / a local `--update-snapshots`
// run) so the very first baselines can actually be generated — otherwise a skip-when-no-baselines guard
// would make the bootstrap a no-op (it could never write the first PNGs). Outside those two cases it
// skips (a no-baseline validation run can only write-then-fail), and vrt.yml's zero-screenshot guard
// prevents a fully-skipped run from being mistaken for passing evidence.
const __dirname = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_DIR = join(__dirname, "components.spec.ts-snapshots");
const hasBaselines =
  existsSync(SNAPSHOT_DIR) &&
  readdirSync(SNAPSHOT_DIR).some((f) => f.endsWith(".png"));
const isBootstrap = process.env.VRT_UPDATE === "1";
const describeVRT =
  hasBaselines || isBootstrap ? test.describe : test.describe.skip;

const PAGES = [
  "/docs/foundations/colors",
  "/docs/foundations/typography",
  "/docs/foundations/icons",
  "/docs/foundations/motion",
  ...COMPONENT_ROUTES,
  "/docs/guides/quickstart",
  "/docs/guides/registry-auth",
  "/docs/guides/agent-skills",
  "/docs/guides/components",
  "/docs/guides/provider-setup",
  "/docs/guides/theming",
  "/internal/internal-projects",
  "/docs/guides/external-projects",
  "/docs/guides/production-checklist",
  "/docs/guides/troubleshooting",
  ...BLOCK_ROUTES,
  "/docs/utilities/shimmer",
  "/docs/utilities/scroll-fade",
  "/",
];

describeVRT("VRT — showcase pages", () => {
  for (const path of PAGES) {
    test(`VRT ${path}`, async ({ page }, testInfo) => {
      // `toHaveScreenshot` only disables CSS animations — JS-driven animation (recharts' line/area
      // draw tween is the first in the system) races the capture. Emulating reduced motion makes
      // JS-animated components render their settled end state (recharts honors it natively), and
      // pins the a11y-correct reduced-motion rendering as the baseline besides.
      const darkLane = testInfo.project.name.endsWith("-dark");
      await page.emulateMedia({
        colorScheme: darkLane ? "dark" : "light",
        reducedMotion: "reduce",
      });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      // Fail if next-themes/local storage ever makes a lane capture the wrong token scope.
      await expect
        .poll(() =>
          page
            .locator("html")
            .evaluate((element) => element.classList.contains("dark")),
        )
        .toBe(darkLane);
      // MessageScrollerItem uses `content-visibility: auto` — Chromium's full-page screenshotter
      // skips painting those subtrees when they sit outside the visual viewport, so every
      // below-the-fold transcript captured EMPTY and the component's VRT coverage was void
      // (audit finding). Forcing them visible only for the capture restores real coverage;
      // runtime behavior in the app is unchanged.
      await page.addStyleTag({
        content:
          '[data-slot="message-scroller-item"] { content-visibility: visible !important; }',
      });
      await expect(page).toHaveScreenshot(`${path.replaceAll("/", "_")}.png`, {
        fullPage: true,
      });
    });
  }
});

// The full-page lane protects the docs composition. This second lane isolates the primary rendered
// fixture for every one of the 97 component pages, so a component-state pixel change cannot hide
// inside a tall page's fixed allowance. The first preview on each page is the documented canonical
// specimen; additional state matrices remain covered by the full-page capture.
const COMPONENT_PAGES = PAGES.filter((path) =>
  path.startsWith("/docs/components/"),
);

describeVRT("VRT — component fixtures", () => {
  for (const path of COMPONENT_PAGES) {
    test(`VRT state ${path}`, async ({ page }, testInfo) => {
      const darkLane = testInfo.project.name.endsWith("-dark");
      await page.emulateMedia({
        colorScheme: darkLane ? "dark" : "light",
        reducedMotion: "reduce",
      });
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await expect
        .poll(() =>
          page
            .locator("html")
            .evaluate((element) => element.classList.contains("dark")),
        )
        .toBe(darkLane);

      const fixture = page.locator("[data-vrt-preview]").first();
      await expect(fixture).toBeVisible();
      await expect(fixture).toHaveScreenshot(
        `${path.replaceAll("/", "_")}-state.png`,
        {
          animations: "disabled",
          caret: "hide",
          maxDiffPixels: 0,
          scale: "css",
          threshold: 0,
        },
      );
    });
  }
});

describeVRT("VRT — all animated-icon chunks", () => {
  test("renders every generated icon in deterministic chunks", async ({
    page,
  }, testInfo) => {
    const darkLane = testInfo.project.name.endsWith("-dark");
    await page.emulateMedia({
      colorScheme: darkLane ? "dark" : "light",
      reducedMotion: "reduce",
    });
    await page.goto("/docs/foundations/icons");
    await page.waitForLoadState("networkidle");
    await page.evaluate(() => document.fonts.ready);
    await expect
      .poll(() =>
        page
          .locator("html")
          .evaluate((element) => element.classList.contains("dark")),
      )
      .toBe(darkLane);

    const chunks = page.locator("[data-vrt-icon-chunk]");
    await expect(chunks).toHaveCount(ANIMATED_ICON_CHUNK_COUNT);
    for (let index = 0; index < ANIMATED_ICON_CHUNK_COUNT; index++) {
      const chunk = chunks.nth(index);
      await expect(chunk).toHaveScreenshot(
        `_docs_foundations_icons-icon-chunk-${index + 1}.png`,
        {
          animations: "disabled",
          caret: "hide",
          maxDiffPixels: 0,
          scale: "css",
          threshold: 0,
        },
      );
    }
  });
});

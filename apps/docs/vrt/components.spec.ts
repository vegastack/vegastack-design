import { test, expect, type Page } from "@playwright/test";
import { ANIMATED_ICON_CHUNK_COUNT } from "./icon-chunks.generated";
import { VRT_PAGE_ROUTES } from "./page-routes";

// Pixel capture over every showcase page (real shipped source). This suite is NOT a CI gate and has
// no committed baselines — it is the capture half of `tooling/vrt-review.mjs`, which runs it twice
// on ONE machine (once at the base ref with `--update-snapshots`, once at HEAD comparing against
// that capture) and emits a before/after report for a human to review during `/ship`.
//
// `VRT_SNAPSHOT_DIR` is the single knob. The review tool sets it to the shared scratch directory the
// two captures compare through; playwright.config.ts turns it into `snapshotPathTemplate`, and this
// suite enables itself on the same signal. Without it there is nothing to compare against, so a run
// could only write-then-pass — which is why the suite skips instead. `contracts.spec.ts` lives in
// the same testDir, is never gated, and is what CI actually runs.
const describeVRT = process.env.VRT_SNAPSHOT_DIR
  ? test.describe
  : test.describe.skip;

async function stabilizeDocumentationChrome(page: Page) {
  // A full-page Chromium screenshot scrolls while stitching. Fumadocs' IntersectionObserver then
  // races the capture, moving its active TOC link and clipped thumb track between headings even
  // when the HTML is byte-identical. Keep the complete inactive TOC visible, but remove only this
  // scroll-position-dependent state from the full-page comparison. Component fixtures are
  // unaffected, and the docs runtime is never modified outside this local review harness.
  await page.evaluate(() => {
    const normalize = () => {
      const links = document.querySelectorAll<HTMLAnchorElement>(
        'a[data-active][href^="#"]',
      );
      const roots = new Set<HTMLElement>();
      for (const link of links) {
        if (link.dataset.active !== "false") link.dataset.active = "false";
        if (link.parentElement) roots.add(link.parentElement);
      }
      for (const root of roots) {
        for (const child of root.children) {
          if (
            child instanceof HTMLElement &&
            child.tagName === "DIV" &&
            child.querySelector(":scope > svg") &&
            getComputedStyle(child).position === "absolute"
          ) {
            child.dataset.vrtTocTrack = "true";
          }
        }
      }
    };
    normalize();
    new MutationObserver(normalize).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-active"],
      subtree: true,
    });
  });
  await page.addStyleTag({
    content: '[data-vrt-toc-track="true"] { visibility: hidden !important; }',
  });
}

describeVRT("VRT — showcase pages", () => {
  for (const path of VRT_PAGE_ROUTES) {
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
      await stabilizeDocumentationChrome(page);
      await expect(page).toHaveScreenshot(`${path.replaceAll("/", "_")}.png`, {
        fullPage: true,
      });
    });
  }
});

// The full-page lane protects the docs composition. This second lane isolates the primary rendered
// fixture for every contract component page, so a component-state pixel change cannot hide
// inside a tall page's fixed allowance. The first preview on each page is the documented canonical
// specimen; additional state matrices remain covered by the full-page capture.
const COMPONENT_PAGES = VRT_PAGE_ROUTES.filter((path) =>
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

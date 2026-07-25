import { defineConfig, devices } from "@playwright/test";

// Two suites share this config and this `testDir`:
//
//   contracts.spec.ts   — behaviour contracts (320px reflow, RTL containment, forced-colors focus,
//                         effective 24px pointer targets). Takes NO screenshots, needs no baselines,
//                         runs on every PR in CI. This is the blocking visual-surface gate.
//   components.spec.ts  — pixel capture. It is NOT a CI gate and has no committed baselines. It runs
//                         only under `tooling/vrt-review.mjs`, which captures the SAME routes twice
//                         on ONE machine (base ref, then HEAD) and emits a before/after report for a
//                         human — with their agent — to read. `VRT_SNAPSHOT_DIR` is that tool's
//                         handle: setting it both enables the suite and redirects every snapshot to
//                         the shared scratch directory the two captures compare through.
//
// Because both captures happen on one machine minutes apart, platform and CPU architecture are
// irrelevant and the snapshot path deliberately omits Playwright's `{-snapshotSuffix}` (`-darwin`/
// `-linux`) segment. Nothing produced here is ever committed.
const reviewSnapshotDir = process.env.VRT_SNAPSHOT_DIR;
// The review tool runs two servers back to back, and two developers (or two runners) may review at
// once. A fixed 3000 collides; this keeps each capture on its own port.
const port = Number(process.env.VRT_PORT ?? 3000);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./vrt",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Playwright defaults to ONE worker under CI. That made the 768-check contract gate take 1.4h on
  // `ubuntu-latest` (run 30132112459) versus ~6min locally at 5 workers — the single largest cost in
  // the pipeline, and entirely an unset default. These tests are wait-bound (navigate, networkidle,
  // fonts, then a Tab-by-Tab keyboard walk), so they oversubscribe two cores well. `retries: 2`
  // above absorbs transient contention; if this lane ever turns flaky rather than slow, lower this
  // before touching a timeout.
  workers: process.env.CI ? 4 : undefined,
  // Diagnosability is the whole reason the workflows upload an artifact on failure. Without a
  // reporter there is no `playwright-report/` to upload, and without a trace there is nothing in it
  // but an exit code — which is exactly what left release run 30115971397 undiagnosable for two
  // days. Configure it HERE rather than with `--reporter` on the command line so every caller gets
  // it, and so nobody has to remember that `--reporter` is also a pnpm flag.
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["json"]]
    : [["list"]],
  // The tallest showcase pages (sidebar ~150k px after the Phase S demos) need more than the 30s
  // default: toHaveScreenshot's stability check takes TWO full-page captures back to back, and
  // each capture of a page that tall runs 10s+ under parallel load. The expect timeout below caps
  // the matcher; this caps the whole test.
  timeout: 120_000,
  ...(reviewSnapshotDir
    ? { snapshotPathTemplate: `${reviewSnapshotDir}/{arg}{-projectName}{ext}` }
    : {}),
  expect: {
    // 60s: tall showcase pages (field/table/sidebar…) need well over 5s for the two consecutive
    // full-page captures toHaveScreenshot's stability check requires (Phase −1, CX-2) — and the
    // mobile project's narrow layout makes the same pages taller still (Phase R).
    timeout: 60_000,
    // Full docs pages get a fixed, reviewable allowance. A percentage scales with page height and
    // previously hid tens of thousands of changed pixels on the tallest showcases.
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      scale: "css",
      maxDiffPixels: 100,
      threshold: 0.1,
    },
  },
  use: {
    baseURL,
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    timezoneId: "UTC",
    locale: "en-US",
    // Kept only for failures, so a red contract gate arrives with a replayable trace and a
    // screenshot of the moment it broke instead of a bare exit code.
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], colorScheme: "light" },
    },
    {
      name: "chromium-dark",
      use: { ...devices["Desktop Chrome"], colorScheme: "dark" },
    },
    {
      // Phase R mobile lane: 375×812 (iPhone-X-class), touch-enabled, dsf 1 for deterministic
      // (and reviewable) capture sizes. Catches narrow-viewport overflow the desktop lane can't.
      name: "mobile-chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
        colorScheme: "light",
      },
    },
    {
      name: "mobile-chromium-dark",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
        colorScheme: "dark",
      },
    },
  ],
  webServer: {
    command: `pnpm build && pnpm exec serve out -l ${port}`,
    url: baseURL,
    // NEVER reuse a running server: a leftover dev/static server from an earlier build serves
    // STALE pages, and a capture taken against it silently compares outdated content (bit twice:
    // the X2 chart mid-animation capture and a Phase S sidebar capture taken pre-rewrite).
    // The ~2min rebuild per run is the price of a trustworthy before/after.
    reuseExistingServer: false,
    // 10min: a COLD `next build` exceeds the old 180s (the 2026-07-18 capture run timed out at
    // exactly config.webServer timeout while next build was still going).
    timeout: 600_000,
  },
});

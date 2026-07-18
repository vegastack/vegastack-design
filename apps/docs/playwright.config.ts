import { defineConfig, devices } from '@playwright/test';

// Deterministic VRT over the Fumadocs component previews (which render the real shipped source).
// Runs in the pinned Playwright Docker image in CI for font/render determinism.
// The spec self-activates when committed Linux baselines exist, and `VRT_UPDATE=1`
// bootstraps the first baseline set in the pinned container.
export default defineConfig({
  testDir: './vrt',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // The tallest showcase pages (sidebar ~150k px after the Phase S demos) need more than the 30s
  // default: toHaveScreenshot's stability check takes TWO full-page captures back to back, and
  // each capture of a page that tall runs 10s+ under parallel load. The expect timeout below caps
  // the matcher; this caps the whole test.
  timeout: 120_000,
  expect: {
    // 60s: tall showcase pages (field/table/sidebar…) need well over 5s for the two consecutive
    // full-page captures toHaveScreenshot's stability check requires (Phase −1, CX-2) — and the
    // mobile project's narrow layout makes the same pages taller still (Phase R).
    timeout: 60_000,
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', scale: 'css', maxDiffPixelRatio: 0.01, threshold: 0.2 },
  },
  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    colorScheme: 'light',
    timezoneId: 'UTC',
    locale: 'en-US',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      // Phase R mobile lane: 375×812 (iPhone-X-class), touch-enabled, dsf 1 for deterministic
      // (and reviewable) baseline sizes. Catches narrow-viewport overflow the desktop lane can't.
      name: 'mobile-chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 375, height: 812 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 1,
      },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    // NEVER reuse a running server: a leftover dev/static server from an earlier build serves
    // STALE pages, and baselines captured against it silently pin outdated content (bit twice:
    // the X2 chart mid-animation baseline and a Phase S sidebar baseline captured pre-rewrite).
    // The ~2min rebuild per run is the price of trustworthy screenshots.
    reuseExistingServer: false,
    // 10min: a COLD `next build` on a CI runner exceeds the old 180s (the 2026-07-18 baseline
    // bootstrap timed out at exactly config.webServer timeout while next build was still going).
    timeout: 600_000,
  },
});

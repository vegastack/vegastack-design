import { test, expect } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Visual-regression baseline over every showcase page (real shipped source). Deterministic snapshots
// require the pinned Playwright Docker image (`mcr.microsoft.com/playwright:v1.61.0-noble`) for font
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
const SNAPSHOT_DIR = join(__dirname, 'components.spec.ts-snapshots');
const hasBaselines =
  existsSync(SNAPSHOT_DIR) && readdirSync(SNAPSHOT_DIR).some((f) => f.endsWith('.png'));
const isBootstrap = process.env.VRT_UPDATE === '1';
const describeVRT = hasBaselines || isBootstrap ? test.describe : test.describe.skip;

const PAGES = [
  '/docs/foundations/colors',
  '/docs/foundations/typography',
  '/docs/foundations/icons',
  '/docs/foundations/motion',
  '/docs/components/button',
  '/docs/components/badge',
  '/docs/components/alert',
  '/docs/components/input',
  '/docs/components/field',
  '/docs/components/dialog',
  '/docs/components/select',
  '/docs/components/combobox',
  '/docs/components/tooltip',
  '/docs/components/dropdown-menu',
  '/docs/components/tabs',
  '/docs/components/card',
  '/docs/components/kbd',
  '/docs/components/skeleton',
  '/docs/components/spinner',
  '/docs/components/separator',
  '/docs/components/empty',
  '/docs/components/checkbox',
  '/docs/components/switch',
  '/docs/components/avatar',
  '/docs/components/label',
  '/docs/components/textarea',
  '/docs/components/radio-group',
  '/docs/components/slider',
  '/docs/components/toggle',
  '/docs/components/toggle-group',
  '/docs/components/accordion',
  '/docs/components/collapsible',
  '/docs/components/popover',
  '/docs/components/alert-dialog',
  '/docs/components/progress',
  '/docs/components/breadcrumb',
  '/docs/components/sheet',
  '/docs/components/hover-card',
  '/docs/components/context-menu',
  '/docs/components/pagination',
  '/docs/components/scroll-area',
  '/docs/components/table',
  '/docs/components/status-icon',
  '/docs/components/progress-indicator',
  '/docs/components/truncated-text',
  '/docs/components/icon-button',
  '/docs/components/copy-button',
  '/docs/components/password-input',
  '/docs/components/otp-input',
  '/docs/components/split-button',
  '/docs/components/field-inline',
  '/docs/components/relative-time',
  '/docs/components/settings-row',
  '/docs/components/image',
  '/docs/components/notification-bell',
  '/docs/components/markdown-view',
  '/docs/guides/quickstart',
  '/docs/guides/registry-auth',
  '/docs/guides/components',
  '/docs/guides/provider-setup',
  '/docs/guides/theming',
  '/docs/guides/production-checklist',
  '/docs/guides/troubleshooting',
  '/docs/components/provider',
  '/docs/components/toast',
  '/docs/components/command',
  '/docs/components/page-header',
  '/docs/components/sidebar',
  '/docs/components/filter-bar',
  '/docs/components/auto-save-input',
  '/docs/components/country-select',
  '/docs/components/region-select',
  '/docs/components/date-picker',
  '/docs/components/color-picker',
  '/docs/components/emoji-picker',
  '/docs/components/data-list',
  '/docs/components/text-edit',
  '/docs/components/marker',
  '/docs/components/message',
  '/docs/components/bubble',
  '/docs/components/attachment',
  '/docs/components/message-scroller',
  '/docs/components/item',
  '/docs/components/chart',
  '/docs/components/animated-number',
  '/docs/components/resizable',
  '/docs/components/app-shell',
  '/docs/utilities/shimmer',
  '/docs/utilities/scroll-fade',
  '/docs/blocks/dashboard-01',
  '/docs/components/marketing-surface',
  '/docs/components/section-header',
  '/docs/components/figure-frame',
  '/docs/components/terminal',
  '/docs/components/logo-row',
  '/docs/components/testimonial',
  '/docs/components/staggered-text-reveal',
  '/docs/components/particle-field',
  '/',
];

describeVRT('VRT — showcase pages', () => {
  for (const path of PAGES) {
    test(`VRT ${path}`, async ({ page }) => {
      // `toHaveScreenshot` only disables CSS animations — JS-driven animation (recharts' line/area
      // draw tween is the first in the system) races the capture. Emulating reduced motion makes
      // JS-animated components render their settled end state (recharts honors it natively), and
      // pins the a11y-correct reduced-motion rendering as the baseline besides.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      // MessageScrollerItem uses `content-visibility: auto` — Chromium's full-page screenshotter
      // skips painting those subtrees when they sit outside the visual viewport, so every
      // below-the-fold transcript captured EMPTY and the component's VRT coverage was void
      // (audit finding). Forcing them visible only for the capture restores real coverage;
      // runtime behavior in the app is unchanged.
      await page.addStyleTag({
        content: '[data-slot="message-scroller-item"] { content-visibility: visible !important; }',
      });
      await expect(page).toHaveScreenshot(`${path.replaceAll('/', '_')}.png`, { fullPage: true });
    });
  }
});

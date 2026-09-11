import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";
import type { BrowserEngine } from "./webkit-lane";

const selectedEngine = process.env.VEGASTACK_BROWSER_ENGINE;
const VALID_ENGINES = new Set(["chromium", "firefox", "webkit"]);

if (!selectedEngine) {
  throw new Error(
    "vitest.all-browsers.config.ts must run through `pnpm test:all-browsers`; direct multi-instance execution is deliberately disabled",
  );
}
if (!VALID_ENGINES.has(selectedEngine)) {
  throw new Error(
    `VEGASTACK_BROWSER_ENGINE must be chromium, firefox, or webkit; received ${JSON.stringify(selectedEngine)}`,
  );
}
const engine = selectedEngine as BrowserEngine;

// Main/release confidence lane: the complete browser-unit suite in Chromium,
// WebKit, and Firefox. Pull requests keep the faster Chromium + contract-risk
// smoke split; publishing cannot rely on that subset.
// WebKit is host-conditional — see webkit-lane.ts (macOS 26.6.2 cannot launch it);
// on a Mac in the 26.2–26.5 window it still runs and is enforced. The package script selects ONE
// engine per invocation so the complete suites run sequentially. Direct config use fails closed:
// it was the path that silently multiplied four workers into twelve simultaneous browser pages.
export default defineConfig(() =>
  mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        // Chromium keeps the base suite's proven four-worker topology. Firefox still starves
        // trusted click/focus work at four workers even when it is the ONLY engine (four unrelated
        // 15s actionability failures in one full run), so Firefox and WebKit take one file worker.
        // Engine processes themselves remain sequential in `run-all-browsers.ts`.
        maxWorkers: engine === "chromium" ? 4 : 1,
        // ONE retry, release lane only. Measured 2026-09-09 on a loaded Mac: two Firefox tests
        // (`animated-icons` touch-pointer hover, `stacking` toast-over-dialog) failed in the
        // 258-file run and passed 48/48 when re-run alone, unchanged from main. A retry costs
        // nothing on a green run and turns a load flake into a labelled "retried" result instead
        // of a seven-minute `verify:release` re-run. A test that fails twice still fails the lane.
        retry: 1,
        browser: {
          enabled: true,
          headless: true,
          // `mergeConfig` keeps the base Chromium instance. Add this child's engine when it is
          // different, then let the runner's CLI `--browser.name` filter the merged set to exactly
          // one. Chromium needs no duplicate entry.
          instances: engine === "chromium" ? [] : [{ browser: engine }],
        },
      },
    }),
  ),
);

import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";
import { crossEngineInstances } from "./webkit-lane";

// Main/release confidence lane: the complete browser-unit suite in Chromium,
// WebKit, and Firefox. Pull requests keep the faster Chromium + contract-risk
// smoke split; publishing cannot rely on that subset.
// WebKit is host-conditional — see webkit-lane.ts (macOS 26.6.2 cannot launch it);
// on a Mac in the 26.2–26.5 window it still runs and is enforced.
export default defineConfig(async () =>
  mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        // One file at a time, with all three engines still running concurrently.
        // Inheriting the Chromium lane's four file workers multiplies into twelve
        // simultaneous browser pages; under the complete 100+ file suite that
        // starves trusted click/focus and editor/portal tasks until their 15s
        // actionability timeout. Focused reproductions remain green, confirming
        // resource contention rather than component defects.
        maxWorkers: 1,
        // ONE retry, release lane only. Measured 2026-09-09 on a loaded Mac: two Firefox tests
        // (`animated-icons` touch-pointer hover, `stacking` toast-over-dialog) failed in the
        // 258-file run and passed 48/48 when re-run alone, unchanged from main. A retry costs
        // nothing on a green run and turns a load flake into a labelled "retried" result instead
        // of a seven-minute `verify:release` re-run. A test that fails twice still fails the lane.
        retry: 1,
        browser: {
          enabled: true,
          headless: true,
          instances: await crossEngineInstances(),
        },
      },
    }),
  ),
);

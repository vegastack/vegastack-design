import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

// Main/release confidence lane: the complete browser-unit suite in Chromium,
// WebKit, and Firefox. Pull requests keep the faster Chromium + contract-risk
// smoke split; publishing cannot rely on that subset.
export default mergeConfig(
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
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: "webkit" }, { browser: "firefox" }],
      },
    },
  }),
);

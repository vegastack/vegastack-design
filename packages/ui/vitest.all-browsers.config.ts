import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

// Complete local-ship confidence lane in Chromium, WebKit, and Firefox. The exact test-file
// universe is reconstructed from the current config/filesystem and retained in structured evidence;
// no CI runner executes browsers under current policy.
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      // One file at a time, with all three engines still running concurrently.
      // Inheriting the Chromium lane's four file workers multiplies into twelve
      // simultaneous browser pages; under the complete machine-derived suite that
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

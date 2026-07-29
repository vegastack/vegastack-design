import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";
import smokeTests from "./contract-smoke-tests.generated.json";

// Cross-browser risk smoke: the machine-generated file authority selects tests for evidenced
// cross-engine risk and runs them in Chromium, WebKit, and Firefox. Never infer its inventory from
// this comment; `sync-smoke-impact` and the structured report own selection and executed counts.
// NOTE: mergeConfig UNIONS the base config's instances, so this lane actually runs
// chromium+webkit+firefox — intentional (one command proves three-engine parity).
// First finding on day one: WebKit's Tab-skips-buttons convention broke a simulated-Tab
// keyboard test whose component was fine in all engines (password-input, fixed).
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: smokeTests,
      // One file at a time, with Chromium/WebKit/Firefox still running concurrently. Four file
      // workers multiply into twelve active browser pages and starve requestAnimationFrame-driven
      // motion/replay assertions on a local developer host. No CI runner executes this lane; the
      // complete local ship lane uses the same conservative ceiling for resource stability.
      maxWorkers: 1,
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: "webkit" }, { browser: "firefox" }],
      },
    },
  }),
);

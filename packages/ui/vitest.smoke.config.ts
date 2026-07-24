import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";
import smokeTests from "./contract-smoke-tests.generated.json";

// Phase M cross-browser smoke lane (CX-13): the motion pack's three mechanisms — keyed presence,
// replay APIs, and the CSS motion-* utilities — run against real WebKit and Firefox engines, not
// just Chromium. Deliberately a SUBSET (the files exercising motion + a representative form
// control), not the whole suite: the full 900+ suite × 3 engines would triple wall-clock for no
// added signal on non-motion code. Run via `pnpm --filter @vegastack/ui test:smoke`.
// NOTE: mergeConfig UNIONS the base config's instances, so this lane actually runs
// chromium+webkit+firefox — intentional (one command proves three-engine parity).
// First finding on day one: WebKit's Tab-skips-buttons convention broke a simulated-Tab
// keyboard test whose component was fine in all engines (password-input, fixed).
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: smokeTests,
      browser: {
        enabled: true,
        headless: true,
        instances: [{ browser: "webkit" }, { browser: "firefox" }],
      },
    },
  }),
);

import { readFileSync } from "node:fs";
import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";
import { crossEngineInstances } from "./webkit-lane";
// @ts-expect-error — plain .mjs tooling helper, no type declarations by design
import { ensureBuildOutputs } from "../../tooling/lib/derived-build-outputs.mjs";

// `contract-smoke-tests.generated.json` is an untracked BUILD OUTPUT (WP4/R4). This config is read
// at load time, before any script in this package has had a chance to run, so it generates the file
// on demand rather than importing it — a static `import … from "./contract-smoke-tests.generated.json"`
// would make a fresh clone fail to even parse the config.
ensureBuildOutputs();
const smokeTests: string[] = JSON.parse(
  readFileSync(
    new URL("./contract-smoke-tests.generated.json", import.meta.url),
    "utf8",
  ),
);

// Phase M cross-browser smoke lane (CX-13): the motion pack's three mechanisms — keyed presence,
// replay APIs, and the CSS motion-* utilities — run against real WebKit and Firefox engines, not
// just Chromium. Deliberately a SUBSET (the files exercising motion + a representative form
// control), not the whole suite: the full 900+ suite × 3 engines would triple wall-clock for no
// added signal on non-motion code. Run via `pnpm --filter @vegastack/ui test:smoke`.
// NOTE: mergeConfig UNIONS the base config's instances, so Firefox (and, when it launches, WebKit)
// join the base Chromium — one command proves cross-engine parity.
// First finding on day one: WebKit's Tab-skips-buttons convention broke a simulated-Tab
// keyboard test whose component was fine in all engines (password-input, fixed).
// WebKit is host-conditional — see webkit-lane.ts (macOS 26.6.2 cannot launch it).
export default defineConfig(async () =>
  mergeConfig(
    baseConfig,
    defineConfig({
      test: {
        include: smokeTests,
        // One file at a time, with Chromium/WebKit/Firefox still running concurrently. Four file
        // workers multiply into twelve active browser pages and starve requestAnimationFrame-driven
        // motion/replay assertions on the two-core pinned CI runner. The full release lane already
        // uses this proven concurrency ceiling for the same resource-contention reason.
        maxWorkers: 1,
        browser: {
          enabled: true,
          headless: true,
          instances: await crossEngineInstances(),
        },
      },
    }),
  ),
);

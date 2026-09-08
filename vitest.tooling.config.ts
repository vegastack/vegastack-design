import { defineConfig } from "vitest/config";

/**
 * The `tooling` vitest project — the seed of the one-runner-one-report target in
 * docs/plans/2026-09-08-verification-rebuild.md § 3.3.
 *
 * Today it holds one suite (workspace-clean). WP3 moves the remaining `tooling/verify-*.mjs`
 * verifiers here, so that `pnpm lint` produces a single test report instead of a chain of 20-odd
 * bespoke scripts each printing its own format and each with its own idea of what a failure is.
 *
 * Node environment, no browser: nothing under `tooling/` touches a DOM. Kept as a SEPARATE config
 * from `packages/ui/vitest.config.ts` rather than a workspace project because that one is
 * browser-mode and the two cannot share a pool.
 */
export default defineConfig({
  test: {
    name: "tooling",
    environment: "node",
    include: ["tooling/test/**/*.test.mjs"],
    // These suites shell out to `git` and write real temp directories; they are I/O-bound, cheap,
    // and independent, so the default thread pool is fine.
    testTimeout: 30_000,
  },
});

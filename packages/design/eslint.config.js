// @vegastack/design — ESLint flat config (ESM, ESLint 9). Mixed package: cn/preset are
// TS-only but ./icons is React, so it composes the shared react config (superset of base).
// Lints src + the shipped bin (the registry verifier + CLI).
import { react } from "@vegastack/eslint-config/react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    // tsup bundles tsup.config.ts into this transient root file, imports it, then deletes it. Turbo
    // may run build and lint concurrently; ESLint must never enqueue a file whose producer can
    // legitimately remove it between discovery and read.
    ignores: ["dist/**", "node_modules/**", "tsup.config.bundled_*.mjs"],
  },
  ...react,
];

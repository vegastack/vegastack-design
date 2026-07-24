// @vegastack/design — ESLint flat config (ESM, ESLint 9). Mixed package: cn/preset are
// TS-only but ./icons is React, so it composes the shared react config (superset of base).
// Lints src + the shipped bin (the registry verifier + CLI).
import { react } from "@vegastack/eslint-config/react";

/** @type {import('eslint').Linter.Config[]} */
export default [{ ignores: ["dist/**", "node_modules/**"] }, ...react];

---
title: "D3 · Dependencies: mechanical majors, TanStack Table 9, Vitest 5, Changesets 3 + pnpm 12"
labels: [audit-2026-09, dependencies, release]
---

## Context

Audit 2026-09-07, `01-deps.md` batches **7–10**. Depends on D1 and D2. Batch 10 touches the
publish path and is **MK-gated**: prepare it as its own reviewed PR and stop before merging
(AGENTS.md §Releasing).

## Do, as four separate PRs

1. **Mechanical majors** — `motion` 13 (icons: after I1 the factory is the only import site),
   `react-dropzone` 20 (`use-file-drop` is the one consumer), `@atlaskit/pragmatic-drag-and-drop`
   3 (+ per-function imports; `use-drag-reorder` is the one consumer), `@testing-library/jest-dom`
   7 (+ `@testing-library/dom` peer), `globals` 17. Each behind its sanctioned-exception boundary
   file; run the consumer's unit suite and contract routes.
2. **TanStack Table 9** — `data-grid` only: `useTable` + `tableFeatures`, feature-slot row models,
   renames per `01-deps.md` §TanStack; the APG keyboard layer is ours and must not change; contract
   lane for every data-grid fixture; virtualization unaffected.
3. **Vitest 5 + vitest-browser-react 2.3** — after D1's `@vitest/browser` override; gate report
   paths in `tooling/gates.mjs` re-verified; browser-mode unit + axe suite green in Chromium,
   WebKit, Firefox.
4. **Changesets 3 + `changesets/action` v2 + pnpm 12** — one reviewed change touching
   `release.yml`, `tooling/gate-receipt-carry.mjs` (the version-bump carry), `.changeset/config.json`
   (`privatePackages`), `packageManager` and the minis' pnpm; `verify-workflow-security` and
   `verify-gate-receipt-negative` green; **stop before merge and hand to MK**.

## Acceptance

- Per PR: `pnpm gates:push`; for 2 and 3 the full contract lane on data-grid and the three-engine
  suite; for 4 a dry-run of the release workflow's classify + receipt steps on a branch.
- Changelog `📦` entries; `docs/ledger/operator-review.md` notes any behaviour change found.

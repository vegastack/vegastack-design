---
name: vegastack-release
description: Use when releasing VegaStack changes — author a changeset, choose the semver bump, generate a codemod for breaking changes, and run the never-break-downstream release flow.
metadata:
  author: vegastack
  version: "0.1.0"
---

# vegastack-release — release safety

Authority is **Changesets** (not commit-message inference — a visual break can hide under `fix:`).

## Author a changeset
```bash
pnpm changeset    # pick packages + bump + summary
```
The token layer is `linked` (`@vegastack/design-tokens` + `tailwind-preset` + `icons` move together);
`access: "public"`; registry components are versioned via their item `meta.version` + token range, NOT a
changeset group.

## Choose the bump (by change type)
- **Token / brand change → MINOR, additive-only.** Never rename or remove a token within a major. New
  tokens only. Renovate auto-PRs the bump downstream (CI + VRT gate); a stale copied component can't break.
- **Component fix/improvement → item `meta.version` bump.** Downstream pulls via `shadcn add <x> --diff`
  / `--overwrite` (pull-based, never silent). The audit skill flags stale copies.
- **Breaking API / token removal → MAJOR + a published codemod when consumers need mechanical help**
  (`@vegastack/ui-codemod`). Wrong, unsafe, stale, or unnecessary APIs are removed from the source of
  truth; do not keep compatibility aliases just to avoid churn.

## Release flow
On merge to `main`, `changesets/action` opens a "Version Packages" PR (human gate). Merging it runs
`pnpm changeset version` → `pnpm -r build` → `pnpm changeset publish` (public scoped, npm provenance via
`id-token: write` + `NPM_CONFIG_PROVENANCE`) and redeploys docs/registry (which Sigstore-signs the manifest).

## Pre-release lanes
- `changeset version --snapshot canary` → ephemeral per-PR test builds.
- `pre enter next` (dedicated branch only) → beta → rc → stable major runways.

## Verify before publish (CI order)
`tsc --noEmit` → `pnpm lint` (design-lint) → `vitest run` (unit + a11y) → `playwright test` (VRT, Docker) →
`pnpm build` → `pnpm registry:build` + stale-check (`git status --porcelain apps/docs/public/r` empty) →
`changeset status --since=origin/main`.

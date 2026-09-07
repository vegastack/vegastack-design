---
title: "G1 · Gates and lint: receipt v2, fail-closed fixes, twelve new design-lint rules, state-probe geometry in the contract lane"
labels: [audit-2026-09, tooling, gates]
---

## Context

Audit 2026-09-07, `06-tooling-gates.md` TG-01…TG-09 (with reproductions), `04-cross-cutting.md`
§5 and §7, `07-state-probe.md` (the probe rules), `01-system.md` S-04. Decisions: TD-1 (receipt
schema v2; deploy requires `mode: ship`), TD-2 (physical-direction lint), TD-3 (`text-xs`
mono-only), TD-4 (scroll regions keep `tabIndex` with inset ring), TD-6 (**"keep it efficient — do
not re-verify what is verified"**: run the quality gate on every push to `main` but through turbo's
cache so an already-verified tree is a cache hit), TD-7 (narrow turbo `globalDependencies`).
**Land the lint rules after the code batches they enforce** (F1, F2, Di1, Fo1, N1…), or they fail
the tree; the gate fixes (TG-*) can land any time.

## Problem

- TG-01 (High): `deploy.yml:433` claims a full-sweep receipt but `verifyReceipt()` accepts a scoped
  one-route push receipt (reproduced); `gates.mjs:597` drops `all-browsers`/`registry`/`consume`
  from the receipt entirely. TG-02 (High): `GATES_SKIP` records nothing when only ship-only gates
  fail. TG-03: `versionBumpOnly()` cannot see untracked files (2,716 untracked audit files
  classified as "pure version bump"). TG-04: `quality-gate` is publish-conditional; CI only on PRs.
  TG-05: "864 checks / 108 routes" stale in 9 places (real: 880 / 110). TG-06: stale
  `minimumReleaseAgeExclude` (handled in D1). TG-07: 27 `ROOT` derivations, 7 walkers,
  `content-lint.mjs:37-43` returns `[]` on an unreadable root. TG-08: motion pairing accepts raw
  `duration-300`. TG-09: stale `.npmrc` comment.
- Lint gaps (04 §7): physical direction utilities (52 sites), raw numeric sizes (182), restated
  `motion-reduce:` (17), restated focus (7), `font-medium` on body (42), hover literals (33),
  inline ref merges (10), seq announcers (3), descendant-override density (audio-player 76),
  client directive without need (12), viewport magic (7), trailing spaces in class strings.
- The state probe found geometry the contract lane cannot see (hover touching hairlines, clipped
  rings, missing pressed step).

## Do

1. Receipt schema v2: record every gate incl. `all-browsers`, `registry`, `consume`; `skips`
   records every failed gate; `verifyReceipt({ requireFullSweep })` → `mode === "ship"`,
   `contracts.full`, `scopeRoutes === COMPONENT_ROUTES.length`, ship gates present and passing;
   deploy passes it; negative fixtures for the scoped-receipt and skipped-ship-gate cases; one
   fresh `gates:ship` run re-mints the committed receipt (MK runs it).
2. `versionBumpOnly`: untracked files are offenders when `after === null`; case in
   `verify-classify-change.mjs`.
3. Quality gate: run on every push to `main` and on PRs, executing `typecheck`/`lint`/
   `design:verify` **through turbo** with the minis' local cache (and remote cache if enabled) so
   unchanged inputs are cache hits; drop the `publish == 'true'` condition; never a "skip if
   receipt says so" branch.
4. Counts from §Numbers: `gates.mjs`, `gate-receipt.mjs`, `verify-hooks-installed.mjs`,
   `ci.yml`, AGENTS.md read the route/check count from the generated block (or say "every
   component route").
5. `tooling/lib/fs.mjs` (walk, readJson, fatal, ROOT import) adopted by every script;
   `content-lint` exits 2 on an unreadable root; `.npmrc` comment fixed; motion pairing anchored
   to `duration-(fast|base|slow)` + `ease-(standard|emphasized|exit|spring)`.
6. Turbo `globalDependencies` narrowed to the scripts the docs build uses, with a
   `verify-turbo-inputs.mjs` that fails if a build-time script is missing from the list.
7. Design-lint rules (each with a negative fixture in `verify-design-lint-structural`):
   `no-physical-direction`, `no-raw-size` (allowlist `h-px w-0 min-w-0 h-0.5 w-full`),
   `no-motion-reduce`, `no-restated-focus`, `no-font-medium-on-body`, `no-hover-fill-literal`,
   `no-inline-ref-merge`, `no-status-seq`, `max-descendant-overrides` (warn >20),
   `client-directive-needed` (converse of RSC safety, allowlist for Base UI render wrappers),
   `no-viewport-magic`, `no-trailing-space-in-class`, `text-xs-mono-only`. Update
   `skills/internal/review/references/lint-rules.md` (skill-lint keeps the mirror honest).
8. Contract lane: promote `probe-states.mjs` rules into `apps/docs/vrt/contracts.spec.ts` —
   hover wash inset from container hairlines, hover/pressed present on interactive elements,
   focus ring not clipped, inner radius consistent; promote `capture.mjs`/`probe-*.mjs` into
   `tooling/audit/` so the next audit reruns them.
9. Docs: `verify-docs-export` and the extended `content-lint` (from Do1) wired into `pnpm lint`.

## Acceptance

- `node tooling/verify-gate-receipt-negative.mjs` covers scoped-receipt-on-deploy and
  skipped-ship-gate; a synthetic scoped receipt is rejected by the deploy path.
- `pnpm classify` on a tree with one untracked component file requires the component gates.
- A second `pnpm lint` on an unchanged tree completes in seconds (turbo cache hits logged).
- Every new lint rule has a failing fixture and 0 offenders in the registry after the code
  batches; `pnpm lint` green; contract lane green with the new geometry checks.

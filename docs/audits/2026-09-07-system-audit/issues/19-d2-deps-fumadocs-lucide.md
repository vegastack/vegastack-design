---
title: "D2 · Dependencies: Fumadocs 16.15 family, lucide 1.41, axe-core 4.13, Playwright 1.63, recharts 3.10"
labels: [audit-2026-09, dependencies, documentation]
---

## Context

Audit 2026-09-07, `01-deps.md` batches **5–6** (details, migration notes and verification points
per library are there). Depends on D1 (security/alignment first) and should land before or with
Do1 (the docs canon touches the same files as the Fumadocs migration — coordinate: Fumadocs first,
canon on top).

## Do

1. **Fumadocs 16.15.8 family** — `fumadocs-ui`, `fumadocs-core`, `fumadocs-mdx` 15.4,
   `fumadocs-typescript` 5.4, `@fumadocs/story` 1.3 (twoslash stays 3.3.1 until TS 7):
   `search.tsx` rewrite (Orama → the new search client as noted in `01-deps.md` §Fumadocs),
   `hotKey: false` where the docs own ⌘K, Tabs `forceMount` audit, clear
   `.next/fumadocs-typescript` cache, the duplicate-`main` interaction with AppShell/Sidebar
   previews (N1 fixes the previews; verify here), `verify-public-api-docs` rerun, `vrt-review`
   of API tables.
2. **lucide-react 1.41** — icon rename sweep (`Trash` → `Trash2` and the others listed),
   regenerate the animated-icon mirrors (`node tooling/mirror-animated-icons.mjs --refresh`, or
   after I1 the data modules), `verify-animated-icons` green.
3. **axe-core 4.13** — triage new rules against every route (the audit's `capture.mjs --all`
   collects axe per lane); fix or document each new violation.
4. **Playwright 1.63** — pinned browser image/digest updated where the receipt binds it
   (`gate-receipt.mjs` pins Playwright); rerun the three-engine suite locally
   (`pnpm --filter @vegastack/ui test:all-browsers`).
5. **recharts 3.10** — Legend prop migration; chart fixtures recaptured.

## Acceptance

- `pnpm lint`, `pnpm typecheck`, unit + smoke + three-engine suites green; `registry:build` and
  `design:derived` idempotent; both `SITE_VISIBILITY` builds succeed; search works in the static
  export (manual check + the existing search test).
- `docs/ledger/operator-review.md` records the axe 4.13 triage.

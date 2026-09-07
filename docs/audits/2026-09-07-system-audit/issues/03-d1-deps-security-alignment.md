---
title: "D1 · Dependencies: security patches, alignment, Next 16.3, Base UI 1.8 + shadcn 4.21"
labels: [audit-2026-09, dependencies]
---

## Context

Audit 2026-09-07, `01-deps.md` (full version table, per-library "modern features not leveraged",
and the 10 ordered update batches). This issue is batches **1–4**. Decisions: D25 (sanction
`react-day-picker` — Base UI 1.8 has no calendar and shadcn's Calendar in every flavour is
react-day-picker), D30 (sanction `next-themes`), TD-5 (delete the stale
`minimumReleaseAgeExclude`).

## Do, in order (each step its own commit; `pnpm gates:push` between steps)

1. **Security** — `@vitest/browser` → 4.1.10 via `pnpm.overrides`; `@tiptap/*` → 3.31.3; `postcss`
   → 8.5.28; `style-dictionary` → 5.5.3 then `pnpm --filter @vegastack/design-tokens build` and
   `pnpm design:sync:check`; lockfile refresh for the transitive advisories listed in `01-deps.md`
   §Security.
2. **Alignment** — Tailwind 4.3.3 (align `@tailwindcss/node`/`oxide`), `@types/*`, prettier, turbo,
   tsx, sonner (until O2 removes it), `@tanstack/react-virtual`, `react-resizable-panels`, zod
   4.5.4, eslint/typescript-eslint minors, wrangler, `@testing-library/user-event`.
   `pnpm-workspace.yaml`: delete the `fumadocs-*@16.10.5` `minimumReleaseAgeExclude` entries (they
   are no-ops on 16.11.5) and set `minimumReleaseAge` explicitly if a floor is wanted.
3. **Next 16.3.4** — remove the two flags that became defaults (named in `01-deps.md` §Next),
   verify `next build` under the TS-CLI checker (whole project incl. tests), decide the
   `AGENTS.md` agent-rules block (see §Next), fix the stale comment it names.
4. **Base UI 1.8.0 + shadcn CLI 4.21 + `@shadcn/react` 0.3.1** — run the 15 verification points in
   `01-deps.md` §Base UI (Drawer, Toast, Toolbar, Autocomplete deltas matter for O1/O2/M2);
   `pnpm registry:build` idempotency; `node tooling/verify-shadcn-consume.mjs`; decide the shadcn
   `cn` package question (§shadcn); MessageScroller `data-pending-scroll` styling.
5. **AGENTS.md §Sanctioned dependency exceptions** — add `react-day-picker` (5th headless
   primitive, isolated behind `date-picker`; fix the "v9" comment in `date-picker.tsx:30`) and
   `next-themes` (theme engine, isolated behind `provider`). Record the MK sign-off date
   2026-09-07.

## Acceptance

- `pnpm audit` (or the equivalent used in `01-deps.md`) shows no critical/high advisories.
- `pnpm lint`, `pnpm typecheck`, `pnpm --filter @vegastack/ui test`, `pnpm gates:push` green;
  `registry:build` and `design:derived` idempotent.
- `docs/ledger/operator-review.md` records the Base UI 1.8 verification results.

## Out of scope

Fumadocs/lucide/axe/Playwright/recharts (D2), majors (D3). No `/ship`.

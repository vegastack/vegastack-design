# Consumer starter + downstream guide (provider item → starter app → Fumadocs guide)

> **Historical record — no current authority.** This approved plan has been implemented. Its
> “awaiting build” status is preserved as the pre-execution record; use the current source, reference
> starter, guides, and `AGENTS.md` for present behavior.

**Date:** 2026-07-18 · **Approved by:** MK (chat: provider=registry item, starter=local-only, stack=Next 16+pnpm) · **Status:** awaiting build go-ahead
**Goal:** a downstream team can go zero → production dashboard with **100% clarity and zero surprises**, proven by a realistic reference app that consumes ONLY production artifacts (published npm + live `design.vegastack.com` registry), and documented as a first-class Fumadocs "Guides" section.

**Order is deliberate:** provider first (it's the one missing consumable), starter second (validates everything for real), guide third (documents what is _proven_, not what is hoped).

---

## Phase 0 — `provider` registry item (closes the last distribution gap)

**Problem:** `VegaStackProvider`/`Toaster` (theme + toasts + tooltip coordination + direction) live only in the **private** `@vegastack/ui` — downstream has no sanctioned install path. MK decision: ship as a **copy-in registry item**.

1. **Canonical** `packages/ui/registry/ui/provider.tsx` — extracted from `packages/ui/src/provider/` (`vegastack-provider.tsx` + `use-vegastack-theme.ts`; the Toaster is NOT duplicated — the existing `sonner` registry item is the consumer Toaster, so the provider imports it via `@ui/sonner`).
   - registry.json item: `provider` (registry:ui), deps `next-themes@0.4.6`, `@vegastack/design@^0.1.0`; `registryDependencies: ["sonner"]`; meta.whenToUse: "wrap your app root exactly once".
   - Registry count: **525 → 526** (update AGENTS.md Numbers).
2. **Kill drift at the source:** `packages/ui/src/provider/vegastack-provider.tsx` becomes a thin re-export of the canonical registry file (same package, private) — one implementation, docs keep dogfooding `@vegastack/ui`, `verify-provider-dogfood` gate keeps passing unchanged.
3. **Tests:** unit test (`provider.test.tsx`): renders children · mounts exactly one Toaster (and none with `toaster={false}`) · applies theme class · direction context. Registry chain: `registry:build` → stamp → `verify-registry-deps` → **real consume verify** (auto-covers the 526th item + its `sonner` graph).
4. **Docs page** `docs/components/provider.mdx` (setup-focused: layout.tsx placement, `suppressHydrationWarning`, double-Toaster warning) + VRT: add route to `PAGES`.
5. **Ship:** commit → deploy workflow (registry rebuild + sign + Cloudflare) so the starter can genuinely `shadcn add @vegastack/provider` from production. (Release run: ui version bump via changeset; npm publish no-ops — registry-only change.)

**Gate 0:** full repo verification suite green + provider installable from the LIVE registry with the service token.

## Phase 1 — Reference starter: `~/code/vegastack-design-starter` (local-only)

A **realistic dashboard app with dummy data** — not a toy — consuming the production path end-to-end. Next 16 · React 19 · Tailwind v4 · pnpm. No workspace links, no local registry: real `npm i @vegastack/design`, real registry over Cloudflare Access.

### 1a. Consumption path (each step later mirrored 1:1 in the Quickstart guide)

1. `pnpm create next-app` → Tailwind v4 → `pnpm add @vegastack/design` (design-tokens arrives transitively)
2. `@import "@vegastack/design/preset.css"` — the one-line CSS setup
3. `npx shadcn@latest init --base base` → verify `info --json` reports `"base": "base"`
4. `components.json` registry namespace with `${CF_ACCESS_CLIENT_ID}/${CF_ACCESS_CLIENT_SECRET}` placeholders; `.env.example` committed, `.env.local` gitignored — token never touches git
5. Integrity-first component adds: `vegastack-design verify --save` → `shadcn add` → `verify --post-write`
6. `shadcn add @vegastack/provider` → wrap `layout.tsx` (+ `suppressHydrationWarning`)

### 1b. The app (every major surface demonstrated with dummy data — local TS fixtures, no external APIs)

- **Shell:** `dashboard-01` block as the base — AppShell sidebar + header, theme toggle, command palette (`command`), notification bell
- **Dashboard page:** stat cards (`card`, `animated-number`), `chart` (recharts, dummy revenue series), `table` + pagination + `data-list` (dummy customers), `badge`/`status-icon` states, `skeleton` loading states, `empty` state (filter to zero results)
- **Settings page:** `field`/`input`/`textarea`/`select`/`checkbox`/`switch`/`radio-group`, `auto-save-input` (fake persistence + toasts), `password-input`, `avatar` upload stub
- **Flows proving the plumbing:** `dialog` + `sheet` (portal/isolation proof), destructive confirm (`alert-dialog`), `toast` success/error from real actions (provider proof), `tooltip` toolbar (shared-delay proof), dark mode across all of it, `Icon` + `BrandIcon` + one animated icon
- **UI states everywhere:** loading/empty/error/success per MK's global standards — this app doubles as the pattern reference

### 1c. Starter is itself properly tested (exemplar for downstream CI)

- `pnpm build` + `typecheck` clean
- **Playwright smoke suite** (~10 specs): dashboard renders w/ data · dialog opens/closes · toast fires on save · dark-mode toggle flips class + persists · table paginates · empty state renders · keyboard: dialog focus trap + Esc
- `vegastack-design check-updates --fail-on-update` — the drift gate, wired in `package.json` scripts + a sample `ci.yml` (works when the repo gets a remote later)
- README: run instructions + "what this demonstrates" map with file links

**Gate 1:** starter builds, all smoke specs pass, `check-updates` green against production, screenshots captured for the guide.

## Phase 2 — Fumadocs "Guides" section (documents the proven path)

New nav section **Guides** (existing `install.mdx` refactored into it; no duplicated content — pages cross-link):

| Page                          | Covers                                                                                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `guides/quickstart`           | zero → rendered dashboard shell; literally the starter's steps 1a.1–6 with the same commands, ~10 min                                                                                                                             |
| `guides/registry-auth`        | service-token model (who gets tokens: internal yes / external never), env wiring, components.json, token rotation                                                                                                                 |
| `guides/components`           | add → verify → own; `check-updates` → `--diff` → `--overwrite`; hash-not-version mental model; blocks vs components vs hooks vs icon items                                                                                        |
| `guides/provider`             | what it wires + the 4 things that silently break without it; layout placement; double-Toaster rule                                                                                                                                |
| `guides/theming`              | one-file token override, dark mode via provider, fonts, the base.css a11y layer warning (focus rings), `design-tokens` standalone use                                                                                             |
| `guides/production-checklist` | React 19 / Tailwind v4 / Node floors · pnpm-strict notes · portal `isolation` · CI drift gate · what to pin                                                                                                                       |
| `guides/troubleshooting`      | every failure mode with exact error text → fix: 403 from registry (token/env), toasts do nothing (no provider), no focus rings (skipped base layer), popups under content (isolation), `base` not `radix` mismatch, OTP/2FA notes |

Every page links the starter's real files (path references, since repo is local-only for now). **Gates:** content-lint · lint-links (99 → ~107 pages) · **VRT**: new routes added to `PAGES`, baselines bootstrapped via the CI container loop (known drill), both lanes committed.

## Phase 3 — Wire-up & records

- AGENTS.md: Numbers (526), provider decision resolved (dated, MK); consume skill §1/§3 rewritten to the provider item (removes the "UNRESOLVED owner decision" block); component-matrix tracking note for `provider` (chat-family precedent: documented gap, not backfilled).
- Deploy docs (guide live) → re-verify Access checks still green.
- Memory: provider decision + starter location.

## Risks / notes

- **Provider extraction:** `use client` + `@ui/sonner` import must survive the `shadcn add` alias rewrite — the consume-verify's real-CLI gate covers exactly this; if the Toaster composition fights the item model, fallback is a self-contained provider item (accepting one deliberate copy of the 20-line theme hook).
- **VRT churn:** new pages → the familiar bootstrap→commit cycle (budgeted, not a surprise).
- **Starter env:** requires the real service token in `.env.local` locally — never committed; guide documents `.env.example` flow.
- **Sequencing hard requirement:** Phase 0 must DEPLOY before Phase 1 step 6 (starter installs provider from production).

## Estimate

Phase 0 ~half day (incl. deploy + VRT cycle) · Phase 1 ~1 day (app + smoke suite) · Phase 2 ~half–1 day (7 pages + VRT cycle + deploy) · Phase 3 ~1h. Commits at each phase boundary, **each gated on MK approval** (no auto-commits).

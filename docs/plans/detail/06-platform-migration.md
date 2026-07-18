# detail/06 — `engg-vegastack-platform` Migration (P4)

> Detailed sub-plan. **Revised after the P1 checkpoint** (showcase deployed) per MK — the cutover specifics depend on the proven pipeline. Source app facts from [research/catalog-vegastack-platform.md](../../research/catalog-vegastack-platform.md): Next 16.2.6, React 19.2, Tailwind v4 (OKLCH), `radix-ui`, OpenNext+R2, pnpm 10.28.2, platform `Vega*` wrappers in `src/components/common`, and shadcn primitives in `src/components/ui`.

The platform is the first real consumer and the hard test (app-coupled extraction on a live app). It already has the right infra — **no Tailwind/pnpm/Next/deploy lift.**

## 4.0 Prereqs
1. `pnpm add @vegastack/tokens @vegastack/tailwind-preset @vegastack/utils @vegastack/icons` (**public — no token**).
2. `src/app/globals.css`: replace the hand-written OKLCH token block with `@import "@vegastack/tokens/theme.css";` + the `@theme inline` semantic mapping (detail/02 §1); keep a thin project-local `@layer theme` override for any platform-only values; **fix the `outline:none !important` defect** → `:focus-visible` (requirements §7.5).
3. Wrap the app root in `<VegaStackProvider>` (replaces the current `next-themes` + Sonner + tooltip providers).
4. `components.json`: add the `@vegastack` registry + CF Access headers (internal shared token in CI secrets) — detail/04 §4.
5. Add the Renovate preset (`github>VegaStack/renovate-config`).

## 4.1 Parallel adoption (no big-bang)
New code uses `@vegastack`; existing `Vega*` stays until cut over. Keep `src/components/ui` + `common` in place; migrate component-by-component behind PRs. The app stays shippable throughout.

## 4.2 Token cutover (visual parity gate)
After 4.0, run a Playwright screenshot diff of representative pages **before vs after** the token swap. The OKLCH values in `@vegastack/tokens` are ported from the platform's own values, so parity should be ~pixel-identical; investigate any diff (likely a token-name normalization). Lock the token layer only once parity passes.

## 4.3 App-coupled → presentational extraction (G7) — map first, then code
For each app-coupled component, replace the platform component with the `@vegastack` **presentational core** wrapped by the platform's **existing data-fetching wrapper**:

| Platform component | `@vegastack` presentational core | App keeps (wrapper) |
|---|---|---|
| `VegaAvatar` | `Avatar` (takes `src`/`fallback`) | R2 URL resolution |
| `R2Image` | `Image` (presentational) | R2 path → URL |
| `VegaUser/Agent/TeamHoverCard` | `HoverCard` (takes resolved content) | ID → user/agent/team fetch |
| `CommandMenu` | `Command` (presentational ⌘K shell) | route registry + actions |
| `AutoSaveInput` | `Input` + a small save-state UI | debounced persistence |

Write the wrapper map as a checklist before editing; each wrapper is a thin platform-side component that fetches and passes resolved props down.

## 4.4 Component-by-component cutover (leaf → composite order)
Per component:
1. `pnpm dlx shadcn@latest add @vegastack/<name>` → lands in `src/components/ui/<name>.tsx` (verify the stamped `meta.integrity` matches the registry manifest).
2. Run the import/prop **codemod** (`npx @vegastack/ui-codemod@latest <transform> src/`) — `VegaButton` → `Button` (O1 resolved → drop the prefix, Model A); map renamed props.
3. Delete the old `common/vega-<name>.tsx`.
4. Run `vitest` + Playwright VRT for the touched routes.
5. One PR per component (or per small group). Order: **leaf components first** (Button, Badge, Input, Tooltip…), **composites last** (DataList, PageHeader, FilterBar, TextEdit).

## 4.5 Codemods
Ship `@vegastack/ui-codemod` (jscodeshift) transforms for: prefix drop (`Vega*` → unprefixed), prop renames, and import-path rewrites (`@/components/common/...` → `@/components/ui/...`). One transform per breaking change; documented in `MIGRATION.md`.

## 4.6 Verify (exit gate)
- Full app build + e2e + Playwright visual diff vs the pre-migration baseline.
- Confirm **zero local component copies** beyond intentional overrides (grep `components/common` for remaining `Vega*`).
- Confirm an `@vegastack/tokens` bump **Renovate-PRs into the platform and repaints with no code edits** (additive-only proof, §5.4).
- Confirm the platform's OpenNext+R2 deploy is unaffected (token layer is build-time; registry copy-in is local).

## 4.7 Rollback
Every step is its own PR. Revert = `git revert` the PR + pin `@vegastack/tokens` to the prior version in the lockfile. Because components are copied-in, a registry regression cannot reach the platform without an explicit `shadcn add` — there is no runtime/auto path to break it.

## Sequencing vs the rest of the plan
P4 runs **after** P3 (64-component system ported + skills live) and **after** the P1 checkpoint proved the pipeline. The rich-text path migrates as `text-edit` base only; platform collaboration (if any) stays on its current self-hosted Yjs until the `text-edit-collab` adapter contract (F4) is specced.

> **Revise this file after the P1 checkpoint** with: the exact component cutover order (from the proven wave grouping), the final O1 naming decision (prefix or not → drives the codemod), and the confirmed `DataList` placement.

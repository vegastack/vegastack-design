# AGENTS.md — vegastack-design

VegaStack's internal design system: **shadcn `base-nova`** (Base UI + Tailwind v4) with OKLCH semantic tokens, distributed as two public npm packages plus a private, Sigstore-signed shadcn registry, and consumed by humans and by agents (Claude Code, Codex). Every component shadcn ships is upstream's own file plus an approved patch; every difference traces to a decision ID. It is shipped and live — `design.vegastack.com` is public except `/r/*`, which is behind Cloudflare Access Service Auth, and npm publishing is token-free OIDC from self-hosted runners. **This file is the rulebook**: always-on rules, the map, a router. Procedures live in skills, loaded on demand; history lives in `docs/ledger/` and `docs/plans/`. Skills live in `skills/{internal,public}/`, symlinked into `.claude/skills/` and `.agents/skills/`; both agents load one by description, Claude Code also by `/<directory-name>`, and `skills/README.md` documents the audience split. Load the skill rather than working from this file's summary, which is deliberately lossy. For versions, ask rather than recall:

```bash
npm view @vegastack/design version                              # what consumers have
node -p "require('./packages/design/package.json').version"     # what this tree would publish
```

## Truth hierarchy

1. **The source and the scripts that enforce it** — `vendor/shadcn/4.21.0/` (the pinned pristine upstream), `packages/ui/registry/ui/*`, `packages/ui/upstream/patches/*`, `tooling/design-lint.mjs`, `tooling/upstream/*`, the `verify-*`/`sync-*` gates. Prose that disagrees with an enforcing script is a bug in the prose.
2. **Machine authorities** — `packages/ui/component-contracts.json` and `packages/ui/registry.json` for inventory, membership, and counts; `packages/ui/upstream/decisions.json` for whether a deviation from upstream is sanctioned, and `exception-map.json` for which component owns it. Never quote a count from prose.
3. **Official docs for the version actually installed** — check `package.json`/the lockfile first; recalled Base UI, Tailwind, shadcn, Next, and React knowledge is usually a version behind.
4. **`design.md`** — the canonical design doctrine, and a _living_ document gated by `pnpm design:sync:check`. A change of direction that leaves it behind is an incomplete change.
5. **This file**, then **skills** — which are more specific, and usually newer than this file.

Higher wins, because most wrong answers come from trusting a document that stopped being true — and `docs/plans/`, `docs/audits/`, `docs/gap-analysis.md`, `docs/requirements.md`, and `docs/ledger/*` are **point-in-time records**: read them for _why something was decided_, never as evidence of current behaviour, counts, or APIs. Locked decisions stay locked wherever they are written down.

## The five non-negotiables

1. **Edit the canonical source only, and for a shared component canonical = upstream + an approved patch.** Every component exists in three places; two are generated. A component shadcn ships starts from `vendor/shadcn/4.21.0/ui/<name>.tsx` verbatim, every time, and differs from it only where a decision row marks the ID **ours**. A difference with no row is not a shortcut — it is a stop-and-ask.
2. **Semantic tokens only.** No hex, no px, no raw Tailwind palette, anywhere in component source.
3. **Server-safe by default.** `'use client'` only at the lowest interactive leaf.
4. **Never hand-edit a generated file.** If a file says GENERATED, change its authority and rerun.
5. **Shipping is always MK's decision.** Prepare and stop until MK says `ship it`; that one instruction covers the reviewed change PR, generated Version Packages PR, publication, deploy, verification, and the bounded corrective loop.

## Task router

| You are about to…                                   | Do this                                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Add or change a component, hook, or block           | Load the **`component`** skill — its first question is whether upstream ships the component        |
| Review or audit this repo — compliance, drift, bugs | Load the **`review`** skill                                                                        |
| Release, publish, deploy, or write a changeset      | Load the **`ship`** skill                                                                          |
| A failed `pnpm verify`, or a blocked commit         | Read the run's output — `tooling/verify.mjs` names the failing stage — then the **`review`** skill |
| Plan a non-trivial change                           | Write the plan to `docs/plans/`, present it, and wait for explicit approval before writing code    |
| Write or change a docs page                         | § Docs authoring below, then the `component` skill § 6                                             |
| Know the current counts                             | § Numbers below — generated; never quote a count from prose                                        |
| Answer "why does this differ from shadcn"           | `packages/ui/upstream/decisions.json`, then the row in the reset's `decisions.md`                  |
| Answer "why was this chosen"                        | `docs/ledger/` and `docs/plans/` — see § Truth hierarchy before trusting one as current            |

## Locked decisions

One line each; the rationale is in the cited plan or ledger, which are historical records — read them for _why_, never for _what is true now_. Re-opening one is an MK decision.

- **The system is shadcn `base-nova`, used as-is, plus ninety-six recorded exceptions** (the shadcn reset, approved by MK 2026-09-17/18, `docs/plans/2026-09-18-shadcn-reset/`). **The register is the authority, not this list**: 204 rows in `decisions.md` there, machine copy at `packages/ui/upstream/decisions.json` — 108 resolved as **shadcn** (upstream ships unchanged) and 96 as **ours** (upstream is patched, and the patch header names the ID). `exception-map.json` assigns each exception to the components that must carry it; `ours.json` records the components upstream has no counterpart for; `excluded.json` records the names that DO NOT SHIP here whatever upstream does — both the ones we deleted in favour of an upstream replacement and the ones upstream ships that this system does not want (`sonner`, 2026-09-22). An excluded name leaves the enforced `migrated()` set, which is the only way out of it, and it never leaves quietly: the component, its patch, its registry item and its docs page go with it, and `component-contracts.json`'s expectedCounts fails until the counts move too. There is no third category, and `pnpm upstream:check` proves it. Everything the pre-reset system decided **against** upstream and this register resolves as shadcn — the warm neutral ramp, the surface ladder, the alpha and opacity ladders, the radius cap, the shadow ban, the 14px role type scale, the 400/500 weight ladder, the banned colour transitions, the mandatory pressed step, the Button `variant × tone` API, `IconButton`, the z-band names, the modal scrim, tooltip delays, menu chrome — **is gone**, with no compatibility layer (`docs/MIGRATING-SHADCN-RESET.md`). The reset ships as a MINOR bump, not a 1.0: `@vegastack/design` and `@vegastack/design-tokens` go to 0.5.0 and `@vegastack/ui` to 0.10.0. The marketing layer and its ten components were deleted outright, not ported. A new deviation from upstream is a new MK decision on that register; never invent a row (`A11Y-14` and `A11Y-15` are permanently burned because two subagents did).
- **Stack** — shadcn CLI 4.21.0, style `base-nova` (`-b base` + `-p nova`), pulled with `--pointer` and `--rtl`, colour base `neutral`; `@base-ui/react`; Tailwind v4; Next 16; React 19; Node pinned to 24.20.0 by pnpm (`devEngines.runtime`), not by any runner; pnpm 11; Turborepo 2. A version move is MK's decision: `vendor/shadcn/<cli>/` is committed and hashed, so work continues offline, and the parity gate makes the next bump a reviewable diff.
- **Distribution is hybrid** — public npm (`@vegastack/design` + zero-dep `@vegastack/design-tokens`) plus a private shadcn registry for components (copy-in); `docs/requirements.md` § 3. **Component model A (own it), no `Vega*` prefix** — export `Button`, and let `shadcn add --diff` surface upstream changes for deliberate cherry-pick; there is no pristine-shadcn tier. **The provider ships as a registry item** (`shadcn add @vegastack/provider`), and the `@vegastack/ui` provider is a documented mirror of that canonical source.
- **Tokens and docs** — DTCG → Style Dictionary (`color/oklch` transform, separate light/dark builds, `@theme inline` bridge), with runtime vars `--font-family-*`/`--motion-ease-*` that are never self-referential; docs are Fumadocs, statically exported to Cloudflare Workers Static Assets, and Storybook is deferred.
- **Registry integrity** — whole-item SHA-256 in `meta.integrity`, a Sigstore-signed manifest (GitHub OIDC), and a fail-closed consume preflight. **Auth topology** (2026-07-28) — every non-registry route is anonymous, including `/internal/*`, which stays unlisted, `noindex`, and outside every discovery corpus; `/r/*` alone is service-token-only, and `SITE_VISIBILITY` controls discovery metadata, never authorization.
- **No CI job is GitHub-hosted** — the LAN Debian boxes run affected browser and public-distribution proof; the mac mini runs credential-bearing publication/deployment work. A PR, a release, and a deploy cost zero billable minutes. The exact runner map is enforced by `tooling/verify-workflow-security.mjs` and mutation-tested by its negative harness. **npm publishes token-free via OIDC trusted publishing** from a self-hosted runner, with no `NPM_TOKEN` and no provenance bundle; detail in `docs/RELEASING.md`.
- **A release creates no git tag and no GitHub release** (2026-09-04, reaffirmed 2026-09-09) — Changesets writes versions and changelogs onto the Version Packages PR, while the post-merge workflow calls `npm publish --no-provenance` directly. Neither step creates a tag or release, and nothing consumes one: npm versions plus `meta.integrity` are the release markers. The `@vegastack/design@0.1.1`–`0.3.1` tags are residue of the old path; do not backfill. Detail: `docs/RELEASING.md` § Tags and GitHub releases.
- **PR CI is full-static plus deterministic affected Chromium** (2026-09-15, `docs/plans/2026-09-15-deterministic-affected-ci-and-one-instruction-shipping.md`). `component-contracts.json` owns source/test/preview/cross-cutting ownership; registry dependencies are reconciled against imports; `affected-tests.mjs` walks transitive reverse dependents and fails unknown paths. Broad inputs run named contracts plus fixed geometry canaries. The complete component suite is manual-only (`pnpm test:full --engines chromium|all`) and no automatic main, publish, or deploy workflow repeats PR tests.
- **Job containers are required on Linux and impossible on the mac mini** (R2, 2026-09-08) — the pinned `mcr.microsoft.com/playwright` image, whose tag is derived from `pnpm-lock.yaml`, is what makes a Linux box interchangeable, so the workflow-security gate REQUIRES it there and rejects it everywhere else. This narrows the previous outright ban. **The macOS class is ONE machine** (confirmed by MK 2026-09-09): `vsk-runner-mac-mini-1` and `-2` are two runner agents on `patrick-mac-mini`, both as `/Users/vegastack-runners`, differing only in their runner root — so "the minis" is a plural of agents, the capacity is two concurrent jobs on one host, and every pnpm path a job touches is scoped per agent (`docs/runbooks/ci-runner-provisioning-macos.md`).
- **No committed screenshot lane or baseline** — affected CI runs `packages/ui/test/geometry.browser.test.tsx` only for selected preview fixtures while retaining its global CSS/token and metadata guards. During `/ship`, the agent may create temporary targeted captures in light/dark and narrow/wide for judgment; none is committed or treated as a CI result.
- **Two contract-derived docs files are build outputs, not commits** (R4, 2026-09-08) — see § Single source of truth; the registry copy-in and `public/r/*` stay committed, and the distribution decision is untouched. **The changelog is assembled per version, not edited per PR** (R5, 2026-09-08) — a PR writes a changeset carrying one section marker, `tooling/changelog-assemble.mjs` writes the `/CHANGELOG.md` entry at version time, and `sync-changelog.mjs` regenerates the docs page.
- **One `ship it` is the release authorization** (2026-09-15, corrected after live ruleset validation) — it covers the current reviewed change through exact-SHA change-PR merge, the generated Version Packages PR and its exact-SHA merge, npm OIDC publish, public registry/docs deploy, production verification, and at most three surgical corrective patch iterations. The Version PR is a required protection boundary, not a second approval prompt. Trust-boundary changes named in § Escalation still stop immediately. Rationale: `docs/plans/2026-09-15-version-packages-pr-release-correction.md`.

### Sanctioned dependency exceptions

Adding to either list needs MK sign-off, tracked the same way.

- **Headless primitives** — non-Base-UI packages that own a behavioural core (interaction semantics or the state machine under them) but render nothing. Exactly eight, each isolated behind one registry item so an engine swap touches one file:
  - `@shadcn/react` v0.3 — the original exception, and the only one with **two** subpaths. `@shadcn/react/message-scroller` (the auto-scroll, anchor and prepend-preservation engine behind `message-scroller`) is the entry MK approved first; Batch 6 of the shadcn reset (2026-09-18) adopted `@shadcn/react/questionnaire` with it — upstream's `questionnaire` is that package's question-flow state machine (item sequencing, answer and skip status, shortcut keys, validation, resume, and the `role="progressbar"` / `role="alert"` live regions). No new package and no new MK decision: the package is already sanctioned and its whole surface was pre-approved with upstream's dependency set (DOC-7). Each subpath is imported in exactly one **registry** file, `packages/ui/registry/ui/{message-scroller,questionnaire}.tsx`, so an engine swap still touches one shipped file each; the chrome, the choice card, the tokens and the reduced-motion scroll override are ours. The docs previews import the headless parts a second time, and deliberately: upstream documents an **Unstyled** section on exactly these two pages, and `verify-variant-coverage` requires a live `<ComponentPreview>` under it, so mounting the primitive directly is the only honest demonstration of that section.
  - `@tanstack/react-table` v9 — `data-grid`'s row-model state machine. v9 requires an explicit feature set, and `data-grid` registers exactly one: `rowSortingFeature` plus `createSortedRowModel()`. Column visibility and column order are `data-grid`'s own state, applied before the engine sees a column; `columnVisibilityFeature`, `columnOrderingFeature` and `rowSelectionFeature` exist and are deliberately not adopted. It never touches DOM or focus; the APG grid keyboard layer is ours.
  - `@atlaskit/pragmatic-drag-and-drop` (+ `-hitbox`) — the drag engine behind `use-drag-reorder` (consumed by `board` and `sortable-list`). Pointer-first by design; the keyboard layer, live-region announcements, and "Move to…" menu equivalents are ours.
  - `react-dropzone` — the drop/paste acquisition engine behind `use-file-drop` (and `dropzone`'s thin shell). The four above were approved by MK 2026-07-27 (plan `2026-07-26-crm-commissioned-components.md` §2.1, D1–D4).
  - `react-day-picker` v10 — the calendar state machine (day grid, range selection, month navigation). Base UI ships no Calendar/DatePicker — its own was removed before publish — and shadcn's Calendar is this package under every base, `--base base` included. **One file RENDERS it: upstream's `calendar.tsx`.** Batch 7b of the shadcn reset (2026-09-18) rebuilt `date-picker.tsx` on top of that component, so it no longer mounts a `DayPicker` of its own; what it still imports from the package is the three TYPES it re-exports (`DateRange`, `Matcher`, `DayButton`) and the two matcher EVALUATORS (`dateMatchModifiers`, `rangeContainsModifiers`) that gate its presets against exactly the policy the grid enforces. Re-deriving `Matcher` evaluation would be the drift that gate exists to prevent, so the evaluators stayed and are flagged as the one residue. The `Intl.DateTimeFormat` formatting, the preset rails and the popover composition are ours. Approved by MK 2026-09-07 (audit `2026-09-07-system-audit`, decision **D25**).
  - `input-otp` v1 — the one-time-password state machine behind `input-otp` (one hidden input driving the slots, so paste, autofill and the platform SMS suggestion all work). shadcn ships this package under every base; it is imported in exactly one file, `packages/ui/registry/ui/input-otp.tsx`, and the slot chrome, the separator and the caret are ours. Pre-approved with upstream's whole dependency set by MK 2026-09-18 (`docs/plans/2026-09-18-shadcn-reset/implementation.md` § 9, decision **DOC-7**), adopted in Batch 3.

  - `cmdk` v1 — the command-palette state machine behind `command`: the scoring filter, the selected-item cursor, the group bookkeeping and the `useCommandState` store. Decision **OVL-12** resolves as **shadcn** (upstream's `command` is cmdk under every base), so Batch 4 of the shadcn reset adopted it and retired the Base UI Combobox build; it is imported in exactly one file, `packages/ui/registry/ui/command.tsx`, and the chrome, the dialog shell and the result announcer are ours. Pre-approved with upstream's whole dependency set by MK 2026-09-18 (`docs/plans/2026-09-18-shadcn-reset/implementation.md` § 9, decision **DOC-7**).

  - `embla-carousel-react` v8 — the slide engine behind `carousel`: the scroll snapping, the drag and momentum, the slide index and the `canScrollPrev`/`canScrollNext` state, plus its own plugin protocol. It renders no element of its own — `Carousel` hands it a ref and reads its API — and the arrows, the slide chrome and the keyboard handler are ours. shadcn ships this package under every base; it is imported in exactly one file, `packages/ui/registry/ui/carousel.tsx`. Pre-approved with upstream's whole dependency set by MK 2026-09-18 (`docs/plans/2026-09-18-shadcn-reset/implementation.md` § 9, decision **DOC-7**), adopted in Batch 5.

  Nothing else — a ninth entry is a new MK decision, not a pattern to follow.

- **Theme engine** — `next-themes` (0.4.6): the class/attribute theme switcher, the storage and system-preference listener, and the anti-FOUC inline script. Approved by MK 2026-09-07 (audit `2026-09-07-system-audit`, decision **D30**). It is **mounted** in `provider`, the sanctioned single app-root wrapper, and read in exactly ONE registry item: `provider` itself, where `useVegaStackTheme` is a thin wrapper over its `useTheme()`. Batch 4 of the shadcn reset briefly added a second reader, `sonner`, which needed the resolved theme to pick its own engine colour scheme; that component was retired on 2026-09-22 (OVL-10). `toast`, the Base UI surface, reads nothing — it inherits from the cascade — so a swap changes one file.
- **Notification engine — none; Toast IS the engine** (OVL-10, MK 2026-09-22). Upstream ships both `toast` (Base UI) and `sonner`, and Batch 4 of the shadcn reset shipped both. `sonner` is now retired: the registry item, the docs page and the `sonner` dependency are gone, and the name is recorded in `packages/ui/upstream/excluded.json`. One toaster, one live region, one imperative API. A second notification engine is a new MK decision, not a reinstatement.
- **Measurement engine** — `@tanstack/react-virtual` (same D1/D2 sign-off): windowing maths for `data-grid`'s `virtualize` flag. It measures; it owns no interaction.
- **Renderer / behavior engines** — `react-resizable-panels`, `recharts` (^3.10.1 — upstream pins `3.8.0` exactly; Batch 6 of the shadcn reset reconciled rather than downgraded, because 3.10.1 is the same major, is what `chart.tsx`'s focus behaviour was measured against, and satisfies upstream's range), `motion`, `tiptap`, and `react-markdown` (^10.1.0) with `remark-gfm` (^4.0.1) — the markdown parser behind `markdown-view`, which turns a markdown string into a React tree through a components map we own, and touches neither interaction semantics nor focus (imported by exactly one file, `packages/ui/registry/ui/markdown-view.tsx`; `rehype-raw` is deliberately absent, so no raw HTML is executed). Approved by MK 2026-09-09. Each is named per-component in `packages/ui/registry.json`. These render or animate; they do not own interaction semantics, which is why they are a narrower class than the primitive exception above. Nothing else joins this list by pointing at one of these as a precedent — a new entry is a new MK decision.

## Build rules

**Rebuilt 2026-09-18 by Batch 1 of the shadcn reset** (`docs/plans/2026-09-18-shadcn-reset/`), which
replaced the token contract with shadcn `base-nova`'s `neutral` base and deleted seventeen lint
rules whose decision row resolved to **shadcn**. Enforced by `tooling/design-lint.mjs`. Full token
vocabulary: `skills/internal/component/references/tokens.md`. Rule by rule:
`skills/internal/review/references/lint-rules.md`.

- **Colour** — semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-border`); no hex,
  no NUMBERED Tailwind palette. `bg-black/10` and `bg-white` pass, because they are upstream's own
  scrim vocabulary. There is no surface ladder: `background` → `card`/`popover`/`sidebar` → `muted`
  (well, track, skeleton) → `accent` (hover). `muted`, `accent` and `secondary` share one value and
  are all kept, so a consumer can retune one role without moving the others.
- **Status colour has two inks** — `<family>-foreground` on the solid fill, `<family>-text` on the
  page and on the family's own `/10`–`/30` tint. Using the fill as text on its own tint measures
  3.98–4.35:1; `contrast-check.mjs` gates the `-text` role on every surface and every tint. **A
  tinted status surface therefore takes the `-text` ink, never the fill** (A11Y-13, MK 2026-09-18):
  Button's `destructive` variant, Badge's four tinted variants, Alert's status variants, Field's
  error copy and — since Batch 6 — Bubble's `destructive` variant and Attachment's error
  description. **The row is the rule, not the roster**: it reaches a soft status surface when the
  pair MEASURES under the AA floor A11Y-1 enforces, which is how Batch 2 extended it to Badge and
  how Batch 6 extended it to those two (3.987:1 for `text-destructive` on its own `/10` tint,
  4.116:1 for `text-destructive/80` on `card`; the `-text` ink reads 6.966:1 and 8.323:1 on the
  same composites). Each extension is flagged for MK rather than decided silently, and everything
  that MEASURES at or over the floor — Attachment's error ICON on its tint, at 3.973:1 against the
  3:1 non-text floor — stays upstream verbatim.
- **Focus is one outline, and there is no glow anywhere** — `base.css` owns
  `:focus-visible { outline-2 outline-offset-1 outline-ring }` with `ring` bound to the near-black /
  near-white ink (FOC-1, FOC-2); text entry shows `focus:border-ring/70` and no outline (FOC-3).
  `design-lint`'s `no-focus-ring-glow` rejects `ring-3`, `ring-[3px]`, `ring-ring/NN`,
  `focus-visible:ring-*` and `shadow-[0_0_0_…]` anywhere in `packages/ui/registry/**`. This is the
  one rule that keeps upstream's halo from returning on the next pull.
- **Size, radius, shadow, z-index, alpha, opacity are plain Tailwind** — `h-8`, `size-4`,
  `rounded-xl`, `shadow-md`, `z-50`, `bg-foreground/10`, `opacity-50`. Radius derives from one
  `--radius` (0.625rem) exactly as upstream derives it. The `--size-*`, `--icon-*`, `--panel-width-*`,
  `--z-*`, `--alpha-*`, `--opacity-*` and `--shadow-overlay` families are deleted. **`z-50` is the
  single overlay band and DOM order decides within it, with exactly ONE sanctioned exception**
  (OVL-15, MK 2026-09-22): the Toast viewport and `ToastPositioner` sit at `z-60`, because the
  viewport mounts with the provider before any dialog exists, so DOM order cannot put a toast above
  a scrim it predates. `packages/ui/test/stacking.browser.test.tsx` pins both bands and the hit test
  that proves the ordering; a second `z-60` anywhere is a new MK decision, not a precedent to copy.
- **Type SIZES are Tailwind's stock scale; the METRICS on top of them are ours and global** — a
  `text-sm` is 14px and `text-base` 16px everywhere, including the docs shell, and the role
  utilities (`text-h1`…`h4`, `text-label*`, `text-code*`, `text-mono-label`, `text-display-*`) and
  the 400/500 weight ladder are gone, so `font-semibold` and `text-4xl` are ordinary utilities.
  **`tracking-tight` is NOT** (TYP-15, MK 2026-09-22): the `@theme` bridge declares per-size
  `--text-*--line-height` and `--text-*--letter-spacing` for the heading tier (`text-lg` and up,
  −0.012em at 18px to −0.06em at 72px) and holds the copy tier at zero, which is Geist's own
  copy/heading split. A local `tracking-*` beats the ramp through `var(--tw-tracking, …)`, so
  `design-lint`'s `raw-tracking` rejects every spelling but `tracking-widest` (the keyboard-shortcut
  hint), and `arbitrary-text-size` rejects `text-[13px]`, which can receive neither half of the
  ramp. **No uppercase** (TYP-7 = shadcn, `uppercase-transform`): sentence case everywhere, and a
  CSS transform is banned outright because it rewrites what it is handed — it once rendered the
  token name `--text-lg` as `--TEXT-LG`. `body` carries a declared 14px default (never on `html`,
  which would rescale every rem and override the reader's preference) and
  `-webkit-font-smoothing: antialiased`; the docs shell keeps 16px prose. Fonts stay Geist (TYP-10),
  and mono is for code — a label or a sentence is `font-sans`.
- **Motion pairs nothing** — `transition-all`, `transition-colors`, `duration-100` and `ease-in-out`
  are upstream's vocabulary and are legal. Our `duration-fast|base|slow` and
  `ease-standard|emphasized|exit|spring` tokens remain for the keyed-presence and docked utilities
  (`motion-pop-in`, `motion-enter-up`, `motion-shake`, `motion-flash`, `motion-dock-in/out`,
  `motion-indeterminate`), which are ours. The global reduced-motion reset in `base.css` is the one
  hand-written `!important` in token CSS, and a `motion-reduce:` restatement of it is still a violation;
  in component class strings Tailwind's `!` modifier is allowed only in the counted, upstream-verbatim
  cases `design-lint` lists in `IMPORTANT_MODIFIER_EXEMPTIONS`.
- **Structure and icons** — CVA for variants, `cn()` from `@vegastack/design`, `data-*` for state,
  ref-as-prop (React 19 — never `React.forwardRef`), and Base UI `render` for composition, where a
  single-polymorphic-root component must not `Omit<…, 'render'>`. Icons are `lucide-react`, the
  lucide-animated mirrors, and `thesvg` via `Icon`/`BrandIcon` — no other library, no inline `<svg>`
  as an icon.
- **Responsive and layout** — `min-w-0` on a truncating flex child with `truncate` on an inner span,
  never on the same element as `flex`; touch targets ≥24px via an invisible hit area, verified with a
  real `elementFromPoint` probe rather than `getComputedStyle`.
- **Public API documentation** — every component that is OURS carries JSDoc plus an `@example` on
  each exported part, checked by `tooling/verify-public-api-docs.mjs`. An **upstream-backed**
  component is exempt and documents its API on its docs page instead: upstream ships no JSDoc, and
  adding it would be a patch hunk with no decision ID behind it. **That boundary is derived, never
  listed** (2026-09-18): `tooling/upstream/lib.mjs`'s `migrated()` reads
  `vendor/shadcn/<cli>/ui/*.tsx`, minus the `exempt` record in `packages/ui/upstream/migrated.json`
  — so a name is exempt here exactly while upstream ships a file for it, and is under the parity and
  variant-coverage gates for exactly as long. Editing a JSON array used to move all three at once,
  silently.
- **Server-safe by default** — a _runtime_ claim enforced by `tooling/verify-rsc-safety.mjs`: under
  the `react-server` condition most React hooks are `undefined`, so touching one without
  `'use client'` throws on import in an RSC. Which hooks, and why `@vegastack/design/theme-scope` is a
  separate subpath: `component` skill § 3.
- **Accessibility** — WCAG 2.2 AA while preserving every existing 2.1 assertion; visible
  `:focus-visible` (text-entry fields use a border tint instead), enforced per control by the
  geometry lane, which rejects the user agent's own ring (`outline-style: auto`) by name; must pass
  `axe`; every applicable state implemented — default, hover, focus, loading, empty, error, success,
  disabled.

## Single source of truth

Every component exists in three synced places — canonical `packages/ui/registry/ui/<name>.tsx` (**EDIT THIS**), the byte-for-byte docs copy-in `apps/docs/components/ui/<name>.tsx`, and the built item `apps/docs/public/r/<name>.json` carrying `meta.integrity`. Both generated halves are committed, and `pnpm registry:build` (validate → build → stamp → header → verify-headers → verify-registry-deps) regenerates them idempotently and fully locally. The copy-in dogfoods `shadcn add` — proven by `verify-shadcn-consume.mjs` running the real CLI — so do not replace it with an alias or a symlink without reopening the locked distribution decision, and never fix component styling in a `preview/*.tsx`, which only composes; and **not everything generated is committed**: the home catalog and the animated-icon gallery are build outputs — gitignored, listed in `tooling/lib/derived-build-outputs.mjs`, written by `apps/docs`'s `prepare:content` — so never stage one, because `design:derived:check` ignores them and `tooling/verify-component-contracts.mjs` regenerates and reconciles them instead.

| Authority                              | Regenerate with                        | Generated output                                                                                                                                    |
| -------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/ui/registry/ui/*`            | `pnpm registry:build`                  | docs copy-in, `public/r/*.json` — committed                                                                                                         |
| `packages/ui/component-contracts.json` | `pnpm design:derived`                  | matrix, public skill roster, § Numbers, README § Inventory, every component page's `status`/`since` frontmatter — committed; plus two build outputs |
| `.changeset/*.md`                      | `node tooling/changelog-assemble.mjs`  | the `/CHANGELOG.md` release entry, at version time only                                                                                             |
| `/CHANGELOG.md`                        | `node tooling/sync-changelog.mjs`      | the docs Changelog page                                                                                                                             |
| `skills/public/**`                     | `node tooling/sync-package-skills.mjs` | `packages/design/skills/**`, shipped inside the npm package                                                                                         |
| `design.md`                            | `pnpm design:sync`                     | its derived doc surfaces                                                                                                                            |

## Verification — owned boundaries

```bash
pnpm upstream:check                 # vendor integrity · byte parity · exceptions · variant coverage
pnpm upstream:diff <name>           # (re)author a patch; refuses a header naming no decision
pnpm check:component <name>         # optional: item + transitive reverse dependents + geometry
pnpm check:affected                 # optional: derive affected scope from the working tree
pnpm verify                         # full static + working-tree affected Chromium proof
pnpm verify:static                  # repository-wide non-browser proof
pnpm verify:affected --base A --head B  # exact PR range; what CI runs
pnpm verify:distribution            # public docs/registry artifact proof, no component suite
pnpm test:full --engines chromium   # manual complete audit; use all for 3 engines
pnpm run clean                # report only; --after-run / --weekly reclaim, --dry-run never removes
```

`verify:static` is typecheck → lint → design invariants → cheap non-browser design-package tests, each exactly once. `verify:affected` adds the auditable plan and selected Chromium files. In the geometry file only expensive fixture bodies are scoped: the CSS/token sentinel, preview-barrel resolution, requested-name validation, exclusion map and dynamic-fixture contracts always run. Unknown paths fail classification rather than selecting nothing or triggering the complete suite.

`verify:distribution` is public-only: workspace/registry build, registry idempotency, docs export and its metadata/emitted-CSS contract, links, docs-shell browser contracts and self-test, and the real shadcn consume round-trip. It never runs component regression. Every orchestrator reports per-stage wall time and cleans build artifacts on pass, fail, or interrupt without changing the original exit code.

`pnpm lint` is the static umbrella: Prettier, shadcn base, skill and mirror integrity, changesets, security boundaries, workflow security plus its negative harness, secret scan, **`pnpm upstream:check` plus `pnpm upstream:selftest`**, tooling tests, and package lints.

**`pnpm upstream:check` is the anti-drift set, and it proves four things offline, in this order.** (1) **Vendor integrity** — every committed file under `vendor/shadcn/<cli>/` re-hashed against its own `manifest.json`, failing on a content mismatch, a recorded file that is gone, and a file no pull produced. (2) **Byte parity** — `patches/<name>.patch` applied to the vendor file reproduces the canonical file exactly; a component with no patch must equal upstream; a retired name must stay absent; a canonical file that is neither upstream-backed nor recorded in `ours.json` fails. (3) **Exception discipline** — a patch may only name an ID `decisions.json` marks **ours**, and must name every ID `exception-map.json` assigns to that component. (4) **Variant coverage** — every section on upstream's own docs page exists on ours, matched occurrence by occurrence in document order, each with a live `<ComponentPreview>` whose name the barrel exports, and no two required occurrences answering with the same preview. Claims 2 and 3 are one script; all of them read the vendor tree directly, so none can be switched off by editing a list. `pnpm upstream:selftest` runs the `--self-test` of all four `tooling/upstream/` scripts, including `diff.mjs`, which refuses to write a patch whose header names no decision. Design invariants live in `design:verify`, not inside lint, so `verify:static` does not execute them twice. **A changeset must not link a commit** — squash would orphan it; release assembly adds merged commit links. Gates with fail-open risk keep negative/self-test coverage, including the affected selector, workflow security, design-lint structure, registry integrity, CSS layers, token references and docs shell.

**Two deviations from `docs/plans/2026-09-08-verification-rebuild.md`, recorded here because the plan is a point-in-time record and this file is the rulebook.** (1) The plan (§ 3.4) named `tooling/test/playwright-image-pin.test.mjs`; **that file was never written and must not be.** The invariant it described is enforced instead inside `tooling/verify-workflow-security.mjs`, which derives the container tag from the `playwright` version in `pnpm-lock.yaml` and rejects any second literal copy of it — one authority, checked in `pnpm lint`, so a separate test would only be a third place to drift. (2) The plan (§ 3.3, § 4 WP3) listed `tooling/verify-workflow-security-negative.mjs` for DELETION; it was **kept, expanded, and wired into `pnpm lint`** instead. A gate nothing ever observes failing is indistinguishable from a gate that cannot fail, and the workflow-security gate is exactly that kind — so the negative harness is a locked property of the verification set, not a leftover.

**Per PR: four artefacts** — the component source, its test, its MDX page, and a changeset whose body opens with one section marker. **Per wave or release, in a PR that touches nothing else:** `design.md`, skills plus their mirror, the ledgers, and this file. `design:sync:check` and `design:derived:check` run on every PR; they fail only when code and doctrine disagree, which the wave PR resolves.

## Docs authoring

A component page is part of the component, not a follow-up, and it serves humans and agents from the same source. **The page canon — section order, what each section must contain, and which authority generates it — is `design.md` § Docs canon**; read that table before writing or changing a page. Not negotiable from anywhere: sections appear in the canon's order and Do/Don't is final; the machine-readable half of a section is generated (`InstallSteps`, `Anatomy`, `ApiTable`, `StatesTested`), never typed; an API table lists own props only, expanded, with the literal union, and a part with no own props gets one sentence rather than placeholder rows; the Story explorer appears only where no curated playground does (DD-3). Register the page in `apps/docs/content/docs/components/meta.json`, re-export the preview from the barrel, and add the component's record to `component-contracts.json`. No `{@link}` — MDX parses `{…}` as JS. `tooling/content-lint.mjs` enforces the canon itself — row 0's frontmatter (`registry` is required and is never inferred from the slug; `status` and `since` are contract-owned, generated by `pnpm design:derived`, and must match `component-contracts.json`), the section vocabulary and order, the closing section, and generated-not-typed sections — with a `--self-test` that observes each rule failing. **Canon row 10, `Deviations`, closes a page for a component the shadcn reset has put back on upstream** (Batch 2, 2026-09-18): one bullet per decision ID its patch implements, and nothing after it. Do/Don't closes every other page. The section list of a reset page mirrors upstream's own docs page, which `tooling/upstream/verify-variant-coverage.mjs` holds it to; it also rejects skipped visual tests. `tooling/verify-docs-export.mjs` owns the DD-3 Explorer policy (never both, always wrapped, always under `## Playground`) and rejects a page whose markdown export still carries JSX or an empty API table. **A BLOCK page is not under that canon** (Batch 8, 2026-09-18): a block has no prop surface to document, so its page lives in `apps/docs/content/docs/blocks/`, carries `registry`/`preview` frontmatter and a free section list, and `content-lint`'s canon applies only to `apps/docs/content/docs/components/`. The 68 ported chart blocks share SEVEN family gallery pages (`charts-area` … `charts-tooltip`) rather than a page each — the same shared-surface exemption the 467 animated icons carry, recorded in `component-contracts.json` § modeledExemptions and reconciled member by member by `verify-component-contracts.mjs`. Guides live in `apps/docs/content/docs/guides/`; unlisted/noindex operations guides live in `apps/docs/content/internal/` and are public by policy though excluded from discovery.

## Review, and releasing

The `review` skill covers both halves of a round: **audit** is deterministic — run affected verification, inspect the emitted selection as well as the result, then triage against the design-lint rule set — and **adversarial review** hunts what no gate can see (false ownership, missing reverse edges, fail-open selection, stale generated files). Verify every claim by execution, classify high/medium/low, fix at the root, and record the round in `docs/ledger/codex-rounds.md`, `bugs.md`, and `operator-review.md`. Run both before shipping anything user-visible. Read the `ship` skill for the release procedure; `docs/RELEASING.md` is the reference for the topology.

- **Shipping is MK's decision, expressed once.** An explicit **ship it** authorizes the current reviewed change through commit, push, exact-SHA change-PR merge, exact-SHA Version Packages PR merge, npm publish, public deploy and verification, plus at most three bounded corrective patch iterations. Do not ask again between those steps. A failure that needs a protected trust-boundary change stops immediately.
- **Per change PR the only changelog artefact is a changeset**, carrying exactly one section marker (`🧩/🔧/🗑/🛠/📦/📚/🐛/⚠️`) as enforced by `tooling/changeset-lint.mjs`. Nobody hand-edits `/CHANGELOG.md` between releases, and nobody touches the generated docs page. Changesets assembles every pending entry and version bump on the generated Version Packages PR; its own `PR quality` run validates the positive output scope before merge.
- **Production has one boundary contract**, verified on every deploy: all non-registry routes public, `/internal/*` undiscoverable and `noindex`, and `/r/*` rejecting anonymous requests while accepting and cryptographically validating the service-token response. **Registry updates are pulled, never pushed** (`check-updates` → `--diff` → `--overwrite`), and status is by integrity hash, so an item reads `up to date` when the global version bumped but its content did not.

## Repo map

```
packages/design-tokens/  zero-dep DTCG token contract (theme/base/utilities CSS + JSON)
packages/design/         cn() · icon runtime · Tailwind preset · vegastack-design CLI · shipped public skills
vendor/shadcn/4.21.0/    PRISTINE pinned upstream — never hand-edited, hashed in its own manifest.json
packages/ui/             PRIVATE registry workspace — canonical sources, tests, contracts, registry.json
packages/ui/upstream/    patches/<name>.patch · decisions.json · exception-map.json · ours.json · excluded.json
apps/docs/               Fumadocs showcase, guides, and the registry host (public/r)
tooling/                 verify.mjs (the one command) · upstream/ (pull · diff · parity · variant coverage) · workspace-clean.mjs · registry hashing · design-lint · test/ (the `tooling` vitest project) · runner/ (enrol a Debian box)
skills/                  internal/ maintainer skills (never published) · public/ mirrored into @vegastack/design
docs/                    requirements · gap analysis · plans · ledgers · research · runbooks/ (machine setup)
.github/workflows/       ci · release · deploy
```

`.husky/` carries pre-commit and commit-msg only — CI runs the same command a developer does. `registry/ui/` holds components and hooks, `registry/blocks/` holds copy-once starter compositions; item types beyond `registry:ui` are `registry:hook` (a pure hook, plain `.ts`) and `registry:block` (a starter the consumer owns after install rather than tracking for updates). **Reference repos**, to read rather than re-derive: `~/code/references/fumadocs`, `~/code/engg-vegastack-platform`, `~/code/references/resend-design-skills`.

## Numbers

`packages/ui/component-contracts.json` is the machine authority and `tooling/verify-component-contracts.mjs` fails on any missing or duplicate reconciliation — **the live reconciliation, not only its `--self-test`, runs inside `design:verify`** (wired in Batch 4 of the shadcn reset, 2026-09-18: only the self-test was wired, so the hard-coded wave rosters inside the gate had been stale since Batch 3 with nothing to notice). The block below is generated — never hand-edit it, and never quote a count from memory. Everything else is volatile and has a command instead of a number: docs pages (`find apps/docs/content -name '*.mdx' | wc -l`), registry items served (`ls apps/docs/public/r/*.json | wc -l`).

<!-- NUMBERS:START — generated by tooling/sync-component-derived.mjs from packages/ui/component-contracts.json. DO NOT EDIT. -->

- **Registry items: 666** — 114 components · 467 animated icons · 11 hooks (`use-animation-replay`, `use-announcer`, `use-drag-reorder`, `use-file-drop`, `use-inline-edit`, `use-list-nav`, `use-media-query`, `use-mobile`, `use-modal-inert`, `use-overflow`, `use-platform`) · 4 blocks · 68 chart blocks · 2 libs (`geo-data`, `drag-item`)
- Contract SHA-256: `e087cfc85bdc835a2e49a5481ae17c63980660bedd3c0daa20741d71d3d13b0d`

<!-- NUMBERS:END -->

## Escalation

- **Needs MK, always** — beginning an outward release requires one explicit **ship it**; that single authorization covers the complete current release and its bounded corrective loop. Cloudflare Access, secrets, auth policy, workflow-permission expansion, runner trust, destructive data, version reversal, any new sanctioned dependency exception, **a new row on the shadcn-reset decision register, and a shadcn CLI version move** always stop for a new decision.
- **A rule here conflicts with a skill** — the skill is more specific and usually newer; follow it and flag the conflict so one of them gets fixed. Never silently pick one.
- **A rule conflicts with the code** — the enforcing script is ground truth over any prose, including this file. Fix the prose.
- **Something is genuinely missing or ambiguous** — stop and ask. Do not invent a decision, and do not re-open a locked one to work around a blocker.

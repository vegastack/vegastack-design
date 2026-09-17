# AGENTS.md — vegastack-design

VegaStack's internal design system: Base UI + Tailwind v4 + OKLCH semantic tokens, distributed as two public npm packages plus a private, Sigstore-signed shadcn registry, and consumed by humans and by agents (Claude Code, Codex). It is shipped and live — `design.vegastack.com` is public except `/r/*`, which is behind Cloudflare Access Service Auth, and npm publishing is token-free OIDC from self-hosted runners. **This file is the rulebook**: always-on rules, the map, a router. Procedures live in skills, loaded on demand; history lives in `docs/ledger/` and `docs/plans/`. Skills live in `skills/{internal,public}/`, symlinked into `.claude/skills/` and `.agents/skills/`; both agents load one by description, Claude Code also by `/<directory-name>`, and `skills/README.md` documents the audience split. Load the skill rather than working from this file's summary, which is deliberately lossy. For versions, ask rather than recall:

```bash
npm view @vegastack/design version                              # what consumers have
node -p "require('./packages/design/package.json').version"     # what this tree would publish
```

## Truth hierarchy

1. **The source and the scripts that enforce it** — `packages/ui/registry/ui/*`, `tooling/design-lint.mjs`, the `verify-*`/`sync-*` gates. Prose that disagrees with an enforcing script is a bug in the prose.
2. **Machine authorities** — `packages/ui/component-contracts.json` and `packages/ui/registry.json` for inventory, membership, and counts. Never quote a count from prose.
3. **Official docs for the version actually installed** — check `package.json`/the lockfile first; recalled Base UI, Tailwind, shadcn, Next, and React knowledge is usually a version behind.
4. **`design.md`** — the canonical design doctrine, and a _living_ document gated by `pnpm design:sync:check`. A change of direction that leaves it behind is an incomplete change.
5. **This file**, then **skills** — which are more specific, and usually newer than this file.

Higher wins, because most wrong answers come from trusting a document that stopped being true — and `docs/plans/`, `docs/audits/`, `docs/gap-analysis.md`, `docs/requirements.md`, and `docs/ledger/*` are **point-in-time records**: read them for _why something was decided_, never as evidence of current behaviour, counts, or APIs. Locked decisions stay locked wherever they are written down.

## The five non-negotiables

1. **Edit the canonical source only.** Every component exists in three places; two are generated.
2. **Semantic tokens only.** No hex, no px, no raw Tailwind palette, anywhere in component source.
3. **Server-safe by default.** `'use client'` only at the lowest interactive leaf.
4. **Never hand-edit a generated file.** If a file says GENERATED, change its authority and rerun.
5. **Shipping is always MK's decision.** Prepare and stop until MK says `ship it`; that one instruction covers the reviewed change PR, generated Version Packages PR, publication, deploy, verification, and the bounded corrective loop.

## Task router

| You are about to…                                   | Do this                                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Add or change a component, hook, or block           | Load the **`component`** skill                                                                     |
| Review or audit this repo — compliance, drift, bugs | Load the **`review`** skill                                                                        |
| Release, publish, deploy, or write a changeset      | Load the **`ship`** skill                                                                          |
| A failed `pnpm verify`, or a blocked commit         | Read the run's output — `tooling/verify.mjs` names the failing stage — then the **`review`** skill |
| Plan a non-trivial change                           | Write the plan to `docs/plans/`, present it, and wait for explicit approval before writing code    |
| Write or change a docs page                         | § Docs authoring below, then the `component` skill § 6                                             |
| Know the current counts                             | § Numbers below — generated; never quote a count from prose                                        |
| Answer "why was this chosen"                        | `docs/ledger/` and `docs/plans/` — see § Truth hierarchy before trusting one as current            |

## Locked decisions

One line each; the rationale is in the cited plan or ledger, which are historical records — read them for _why_, never for _what is true now_. Re-opening one is an MK decision.

- **Stack** — `@base-ui/react` via shadcn `--base base`; Tailwind v4; Next 16; React 19; Node pinned to 24.20.0 by pnpm (`devEngines.runtime`), not by any runner; pnpm 11; Turborepo 2.
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

- **Headless primitives** — non-Base-UI packages that own a behavioural core (interaction semantics or the state machine under them) but render nothing. Exactly five, each isolated behind one registry item so an engine swap touches one file:
  - `@shadcn/react/message-scroller` (MessageScroller) — the original exception.
  - `@tanstack/react-table` v9 — `data-grid`'s row-model state machine. v9 requires an explicit feature set, and `data-grid` registers exactly one: `rowSortingFeature` plus `createSortedRowModel()`. Column visibility and column order are `data-grid`'s own state, applied before the engine sees a column; `columnVisibilityFeature`, `columnOrderingFeature` and `rowSelectionFeature` exist and are deliberately not adopted. It never touches DOM or focus; the APG grid keyboard layer is ours.
  - `@atlaskit/pragmatic-drag-and-drop` (+ `-hitbox`) — the drag engine behind `use-drag-reorder` (consumed by `board` and `sortable-list`). Pointer-first by design; the keyboard layer, live-region announcements, and "Move to…" menu equivalents are ours.
  - `react-dropzone` — the drop/paste acquisition engine behind `use-file-drop` (and `dropzone`'s thin shell). The four above were approved by MK 2026-07-27 (plan `2026-07-26-crm-commissioned-components.md` §2.1, D1–D4).
  - `react-day-picker` v10 — the calendar state machine behind `date-picker` (day grid, range selection, month navigation). Base UI ships no Calendar/DatePicker — its own was removed before publish — and shadcn's Calendar is this package under every base, `--base base` included. It is imported in exactly one file, `packages/ui/registry/ui/date-picker.tsx`; the token styling, the Popover trigger chrome, and the `Intl.DateTimeFormat` formatting are ours. Approved by MK 2026-09-07 (audit `2026-09-07-system-audit`, decision **D25**). Nothing else — a sixth entry is a new MK decision, not a pattern to follow.
- **Theme engine** — `next-themes` (0.4.6): the class/attribute theme switcher, the storage and system-preference listener, and the anti-FOUC inline script. Approved by MK 2026-09-07 (audit `2026-09-07-system-audit`, decision **D30**). It is **mounted** in exactly one registry item — `provider`, the sanctioned single app-root wrapper, which is also the only item that reads it (`useVegaStackTheme` is a thin wrapper over its `useTheme()`). `sonner` used to read it too, to resolve the toaster's colour scheme; since the Base UI Toast migration the toast surface reads the theme from the cascade, so a swap changes `provider` alone.
- **Measurement engine** — `@tanstack/react-virtual` (same D1/D2 sign-off): windowing maths for `data-grid`'s `virtualize` flag. It measures; it owns no interaction.
- **Renderer / behavior engines** — `react-resizable-panels`, `recharts`, `motion`, `tiptap`, and `react-markdown` (^10.1.0) with `remark-gfm` (^4.0.1) — the markdown parser behind `markdown-view`, which turns a markdown string into a React tree through a components map we own, and touches neither interaction semantics nor focus (imported by exactly one file, `packages/ui/registry/ui/markdown-view.tsx`; `rehype-raw` is deliberately absent, so no raw HTML is executed). Approved by MK 2026-09-09. Each is named per-component in `packages/ui/registry.json`. These render or animate; they do not own interaction semantics, which is why they are a narrower class than the primitive exception above. Nothing else joins this list by pointing at one of these as a precedent — a new entry is a new MK decision.

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
  3.98–4.35:1; `contrast-check.mjs` gates the `-text` role on every surface and every tint.
- **Focus is one outline, and there is no glow anywhere** — `base.css` owns
  `:focus-visible { outline-2 outline-offset-1 outline-ring }` with `ring` bound to the near-black /
  near-white ink (FOC-1, FOC-2); text entry shows `focus:border-ring/70` and no outline (FOC-3).
  `design-lint`'s `no-focus-ring-glow` rejects `ring-3`, `ring-[3px]`, `ring-ring/NN`,
  `focus-visible:ring-*` and `shadow-[0_0_0_…]` anywhere in `packages/ui/registry/**`. This is the
  one rule that keeps upstream's halo from returning on the next pull.
- **Size, radius, shadow, z-index, alpha, opacity are plain Tailwind** — `h-8`, `size-4`,
  `rounded-xl`, `shadow-md`, `z-50`, `bg-foreground/10`, `opacity-50`. Radius derives from one
  `--radius` (0.625rem) exactly as upstream derives it. The `--size-*`, `--icon-*`, `--panel-width-*`,
  `--z-*`, `--alpha-*`, `--opacity-*` and `--shadow-overlay` families are deleted.
- **Type is Tailwind's stock scale** — `text-sm` is 14px, `text-base` is 16px, everywhere, including
  the docs shell. The role utilities (`text-h1`…`h4`, `text-label*`, `text-code*`,
  `text-mono-label`, `text-display-*`) and the 400/500 weight ladder are gone: `font-semibold`,
  `tracking-tight` and `text-4xl` are ordinary utilities. Fonts stay Geist (TYP-10).
- **Motion pairs nothing** — `transition-all`, `transition-colors`, `duration-100` and `ease-in-out`
  are upstream's vocabulary and are legal. Our `duration-fast|base|slow` and
  `ease-standard|emphasized|exit|spring` tokens remain for the keyed-presence and docked utilities
  (`motion-pop-in`, `motion-enter-up`, `motion-shake`, `motion-flash`, `motion-dock-in/out`,
  `motion-indeterminate`), which are ours. The global reduced-motion reset in `base.css` is the one
  sanctioned `!important`, and a `motion-reduce:` restatement of it is still a violation.
- **Structure and icons** — CVA for variants, `cn()` from `@vegastack/design`, `data-*` for state,
  ref-as-prop (React 19 — never `React.forwardRef`), and Base UI `render` for composition, where a
  single-polymorphic-root component must not `Omit<…, 'render'>`. Icons are `lucide-react`, the
  lucide-animated mirrors, and `thesvg` via `Icon`/`BrandIcon` — no other library, no inline `<svg>`
  as an icon.
- **Responsive and layout** — `min-w-0` on a truncating flex child with `truncate` on an inner span,
  never on the same element as `flex`; touch targets ≥24px via an invisible hit area, verified with a
  real `elementFromPoint` probe rather than `getComputedStyle`.
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

`pnpm lint` is the static umbrella: Prettier, shadcn base, skill and mirror integrity, changesets, security boundaries, workflow security plus its negative harness, secret scan, tooling tests, and package lints. Design invariants live in `design:verify`, not inside lint, so `verify:static` does not execute them twice. **A changeset must not link a commit** — squash would orphan it; release assembly adds merged commit links. Gates with fail-open risk keep negative/self-test coverage, including the affected selector, workflow security, design-lint structure, registry integrity, CSS layers, token references and docs shell.

**Two deviations from `docs/plans/2026-09-08-verification-rebuild.md`, recorded here because the plan is a point-in-time record and this file is the rulebook.** (1) The plan (§ 3.4) named `tooling/test/playwright-image-pin.test.mjs`; **that file was never written and must not be.** The invariant it described is enforced instead inside `tooling/verify-workflow-security.mjs`, which derives the container tag from the `playwright` version in `pnpm-lock.yaml` and rejects any second literal copy of it — one authority, checked in `pnpm lint`, so a separate test would only be a third place to drift. (2) The plan (§ 3.3, § 4 WP3) listed `tooling/verify-workflow-security-negative.mjs` for DELETION; it was **kept, expanded, and wired into `pnpm lint`** instead. A gate nothing ever observes failing is indistinguishable from a gate that cannot fail, and the workflow-security gate is exactly that kind — so the negative harness is a locked property of the verification set, not a leftover.

**Per PR: four artefacts** — the component source, its test, its MDX page, and a changeset whose body opens with one section marker. **Per wave or release, in a PR that touches nothing else:** `design.md`, skills plus their mirror, the ledgers, and this file. `design:sync:check` and `design:derived:check` run on every PR; they fail only when code and doctrine disagree, which the wave PR resolves.

## Docs authoring

A component page is part of the component, not a follow-up, and it serves humans and agents from the same source. **The page canon — section order, what each section must contain, and which authority generates it — is `design.md` § Docs canon**; read that table before writing or changing a page. Not negotiable from anywhere: sections appear in the canon's order and Do/Don't is final; the machine-readable half of a section is generated (`InstallSteps`, `Anatomy`, `ApiTable`, `StatesTested`), never typed; an API table lists own props only, expanded, with the literal union, and a part with no own props gets one sentence rather than placeholder rows; the Story explorer appears only where no curated playground does (DD-3). Register the page in `apps/docs/content/docs/components/meta.json`, re-export the preview from the barrel, and add the component's record to `component-contracts.json`. No `{@link}` — MDX parses `{…}` as JS. `tooling/content-lint.mjs` enforces the canon itself — row 0's frontmatter (`registry` is required and is never inferred from the slug; `status` and `since` are contract-owned, generated by `pnpm design:derived`, and must match `component-contracts.json`), the section vocabulary and order, Do/Don't as the final section, and generated-not-typed sections — with a `--self-test` that observes each rule failing; it also rejects skipped visual tests. `tooling/verify-docs-export.mjs` owns the DD-3 Explorer policy (never both, always wrapped, always under `## Playground`) and rejects a page whose markdown export still carries JSX or an empty API table. Guides live in `apps/docs/content/docs/guides/`; unlisted/noindex operations guides live in `apps/docs/content/internal/` and are public by policy though excluded from discovery.

## Review, and releasing

The `review` skill covers both halves of a round: **audit** is deterministic — run affected verification, inspect the emitted selection as well as the result, then triage against the design-lint rule set — and **adversarial review** hunts what no gate can see (false ownership, missing reverse edges, fail-open selection, stale generated files). Verify every claim by execution, classify high/medium/low, fix at the root, and record the round in `docs/ledger/codex-rounds.md`, `bugs.md`, and `operator-review.md`. Run both before shipping anything user-visible. Read the `ship` skill for the release procedure; `docs/RELEASING.md` is the reference for the topology.

- **Shipping is MK's decision, expressed once.** An explicit **ship it** authorizes the current reviewed change through commit, push, exact-SHA change-PR merge, exact-SHA Version Packages PR merge, npm publish, public deploy and verification, plus at most three bounded corrective patch iterations. Do not ask again between those steps. A failure that needs a protected trust-boundary change stops immediately.
- **Per change PR the only changelog artefact is a changeset**, carrying exactly one section marker (`🧩/🔧/🗑/🛠/📦/📚/🐛/⚠️`) as enforced by `tooling/changeset-lint.mjs`. Nobody hand-edits `/CHANGELOG.md` between releases, and nobody touches the generated docs page. Changesets assembles every pending entry and version bump on the generated Version Packages PR; its own `PR quality` run validates the positive output scope before merge.
- **Production has one boundary contract**, verified on every deploy: all non-registry routes public, `/internal/*` undiscoverable and `noindex`, and `/r/*` rejecting anonymous requests while accepting and cryptographically validating the service-token response. **Registry updates are pulled, never pushed** (`check-updates` → `--diff` → `--overwrite`), and status is by integrity hash, so an item reads `up to date` when the global version bumped but its content did not.

## Repo map

```
packages/design-tokens/  zero-dep DTCG token contract (theme/base/utilities CSS + JSON)
packages/design/         cn() · icon runtime · Tailwind preset · vegastack-design CLI · shipped public skills
packages/ui/             PRIVATE registry workspace — canonical sources, tests, contracts, registry.json
apps/docs/               Fumadocs showcase, guides, and the registry host (public/r)
tooling/                 verify.mjs (the one command) · workspace-clean.mjs · registry hashing · design-lint · test/ (the `tooling` vitest project) · runner/ (enrol a Debian box)
skills/                  internal/ maintainer skills (never published) · public/ mirrored into @vegastack/design
docs/                    requirements · gap analysis · plans · ledgers · research · runbooks/ (machine setup)
.github/workflows/       ci · release · deploy
```

`.husky/` carries pre-commit and commit-msg only — CI runs the same command a developer does. `registry/ui/` holds components and hooks, `registry/blocks/` holds copy-once starter compositions; item types beyond `registry:ui` are `registry:hook` (a pure hook, plain `.ts`) and `registry:block` (a starter the consumer owns after install rather than tracking for updates). **Reference repos**, to read rather than re-derive: `~/code/references/fumadocs`, `~/code/engg-vegastack-platform`, `~/code/references/resend-design-skills`. The **reference consumer**, and the executable ground truth for every guide claim, is `~/code/vegastack-design-starter`.

## Numbers

`packages/ui/component-contracts.json` is the machine authority and `tooling/verify-component-contracts.mjs` fails on any missing or duplicate reconciliation. The block below is generated — never hand-edit it, and never quote a count from memory. Everything else is volatile and has a command instead of a number: docs pages (`find apps/docs/content -name '*.mdx' | wc -l`), registry items served (`ls apps/docs/public/r/*.json | wc -l`).

<!-- NUMBERS:START — generated by tooling/sync-component-derived.mjs from packages/ui/component-contracts.json. DO NOT EDIT. -->

- **Registry items: 599** — 118 components · 467 animated icons · 11 hooks (`use-animation-replay`, `use-announcer`, `use-drag-reorder`, `use-file-drop`, `use-inline-edit`, `use-list-nav`, `use-media-query`, `use-mobile`, `use-modal-inert`, `use-overflow`, `use-platform`) · 1 block (`dashboard-01`) · 2 libs (`geo-data`, `drag-item`)
- Contract SHA-256: `cd0c8ff1271bb9f81a5378bc4a1537ef8991b9b2ac01d7db83b8c47c67a1fea5`

<!-- NUMBERS:END -->

## Escalation

- **Needs MK, always** — beginning an outward release requires one explicit **ship it**; that single authorization covers the complete current release and its bounded corrective loop. Cloudflare Access, secrets, auth policy, workflow-permission expansion, runner trust, destructive data, version reversal, and any new sanctioned dependency exception always stop for a new decision.
- **A rule here conflicts with a skill** — the skill is more specific and usually newer; follow it and flag the conflict so one of them gets fixed. Never silently pick one.
- **A rule conflicts with the code** — the enforcing script is ground truth over any prose, including this file. Fix the prose.
- **Something is genuinely missing or ambiguous** — stop and ask. Do not invent a decision, and do not re-open a locked one to work around a blocker.

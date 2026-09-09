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
5. **Shipping is always MK's decision.** Prepare and stop. Approval for one step is never approval for the next.

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
- **No CI job is GitHub-hosted** — the mac minis run credential-only work and the cross-platform static signal, the LAN Debian boxes run the verification jobs, and a PR, a release, and a deploy each cost zero billable minutes. The empty hosted allowlist is enforced by `tooling/verify-workflow-security.mjs` and negative-tested by its `-negative` harness. **npm publishes token-free via OIDC trusted publishing** from a self-hosted runner, with no `NPM_TOKEN` (the same gate forbids one) and no provenance bundle; detail in `docs/RELEASING.md`.
- **A release creates no git tag and no GitHub release** (2026-09-04, reaffirmed 2026-09-09) — the direct `npm publish --no-provenance` loop that replaced `changesets/action` creates neither, and nothing consumes them: the changelog links commits, no script or skill reads a tag, and the npm version plus `meta.integrity` are the real release markers. The `@vegastack/design@0.1.1`–`0.3.1` tags are residue of the old path; do not backfill. Detail: `docs/RELEASING.md` § Tags and GitHub releases.
- **CI executes the browser lanes; nothing is attested** (R1, 2026-09-08, `docs/plans/2026-09-08-verification-rebuild.md`). One command, `pnpm verify`, runs on a laptop, on a pull request, before a publish, and before a deploy. This **supersedes** the local-first attestation topology of 2026-07-25: the gate-report directory, the tree-hash attestation with its guard jobs and carry, the change classifier, route scoping, and the pre-push hook were all removed on 2026-09-08. History: `docs/ledger/operator-review.md`, 2026-09-09.
- **Job containers are required on Linux and impossible on the minis** (R2, 2026-09-08) — the pinned `mcr.microsoft.com/playwright` image, whose tag is derived from `pnpm-lock.yaml`, is what makes a Linux box interchangeable, so the workflow-security gate REQUIRES it there and rejects it everywhere else. This narrows the previous outright ban.
- **No lane takes a screenshot** (R3, 2026-09-08) — the blocking visual-surface gate is `packages/ui/test/geometry.browser.test.tsx` (320px reflow, RTL containment, effective 24px pointer target) inside `pnpm verify`. The local pixel-review lane and the Playwright-over-the-export contract suite were removed on 2026-09-08; visual judgement during `/ship` is a human opening the docs site.
- **Two contract-derived docs files are build outputs, not commits** (R4, 2026-09-08) — see § Single source of truth; the registry copy-in and `public/r/*` stay committed, and the distribution decision is untouched. **The changelog is assembled per version, not edited per PR** (R5, 2026-09-08) — a PR writes a changeset carrying one section marker, `tooling/changelog-assemble.mjs` writes the `/CHANGELOG.md` entry at version time, and `sync-changelog.mjs` regenerates the docs page.

### Sanctioned dependency exceptions

Adding to either list needs MK sign-off, tracked the same way.

- **Headless primitives** — non-Base-UI packages that own a behavioural core (interaction semantics or the state machine under them) but render nothing. Exactly four, each isolated behind one registry item so an engine swap touches one file:
  - `@shadcn/react/message-scroller` (MessageScroller) — the original exception.
  - `@tanstack/react-table` v8 — `data-grid`'s row-model state machine (sorting, visibility, order). It never touches DOM or focus; the APG grid keyboard layer is ours.
  - `@atlaskit/pragmatic-drag-and-drop` (+ `-hitbox`) — the drag engine behind `use-drag-reorder` (consumed by `board` and `sortable-list`). Pointer-first by design; the keyboard layer, live-region announcements, and "Move to…" menu equivalents are ours.
  - `react-dropzone` — the drop/paste acquisition engine behind `use-file-drop` (and `dropzone`'s thin shell). Approved by MK 2026-07-27 (plan `2026-07-26-crm-commissioned-components.md` §2.1, D1–D4). Nothing else — a fifth entry is a new MK decision, not a pattern to follow.
- **Measurement engine** — `@tanstack/react-virtual` (same D1/D2 sign-off): windowing maths for `data-grid`'s `virtualize` flag. It measures; it owns no interaction.
- **Renderer / behavior engines** — `react-resizable-panels`, `recharts`, `motion`, `tiptap`, and the pre-existing `sonner`. Each is named per-component in `packages/ui/registry.json`. These render or animate; they do not own interaction semantics, which is why they are a narrower class than the primitive exception above.

## Build rules

Enforced by `tooling/design-lint.mjs` and the `review` skill. Full token vocabulary: `skills/internal/component/references/tokens.md`. Rule by rule: `skills/internal/review/references/lint-rules.md`.

- **Colour** — semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-border`); no hex, no raw palette. `text-muted-foreground-faint` is sub-AA: placeholder and disabled copy only. `info` is links and informational UI only — promotion and selection take a ladder rung or `primary`. **Surfaces are one ladder** — `background` → `card` (= `popover` = `sidebar`) → `surface-1` (rest fill / well) → `surface-2` (hover) → `surface-3` (pressed / selected); `secondary`/`muted`/`accent`/`sidebar-*` are ALIASES of those rungs with no independent values, so name the rung in new code, and `border` is derived as `foreground` at `--alpha-border`.
- **Hover/pressed come from the recipe, never a literal** — `surfaceInteractive` and `fillInteractive.<tone>` from `@vegastack/design`; no component writes its own `hover:bg-*`. Every control has a pressed step; a hover wash is inset ≥4px from a container hairline and inherits its inner radius.
- **Size, radius, alpha, z-index** — `--size-*` for control heights and `--icon-*` for icon sizes (never pass `size`/`width`/`height` to a lucide component); radius caps at `rounded-lg` and `rounded-xl` is banned; colour compositing takes `--alpha-*` while whole-element opacity takes `--opacity-*` (never a raw `/NN` or `opacity-NN`); two z-bands only, `z-(--z-raised)` and `z-(--z-overlay)`, never a raw `z-N`.
- **Type** — the weight ladder is 400/500, so `font-bold`/`font-semibold` are banned. Letter-spacing, blur, and shadow are owned by named roles — raw `tracking-*`/`blur-*`/`shadow-*` are banned. `text-4xl`+ is off-scale; use the display tier. **Uppercase is mono-exclusive** and ≤14px.
- **Motion** (see also the `component` skill's mechanism matrix) — `duration-fast/base/slow` paired with `ease-standard/emphasized/exit/spring` in the same class literal, or `motion-pop-in`/`motion-enter-up`/`motion-shake`/`motion-flash`. No raw `duration-[…]`/`ease-[…]`/`cubic-bezier()`; `animate-spin`/`animate-pulse` are the one loader exception. Colour changes are immediate: `transition-colors` and `transition-all` are banned.
- **Structure and icons** — CVA for variants, `cn()` from `@vegastack/design`, `data-*` for state, ref-as-prop (React 19 — never `React.forwardRef`), and Base UI `render` for composition, where a single-polymorphic-root component must not `Omit<…, 'render'>`. Icons are `lucide-react`, the lucide-animated mirrors, and `thesvg` via `Icon`/`BrandIcon` — no other library, no inline `<svg>` as an icon; icon registry items install as `@vegastack/icon-<name>`, so the bare `icon-button` is a component.
- **Responsive and layout** — `min-w-0` on a truncating flex child with `truncate` on an inner span, never on the same element as `flex`; touch targets ≥24px via an invisible hit area, verified with a real `elementFromPoint` probe rather than `getComputedStyle`; and compose `AppShell` (`packages/ui/registry/ui/app-shell.tsx`) rather than hand-rolling a sidebar + header + main shell, since it owns the landmark trio, the skip link, and the content container query.
- **Server-safe by default** — a _runtime_ claim enforced by `tooling/verify-rsc-safety.mjs`: under the `react-server` condition most React hooks are `undefined`, so touching one without `'use client'` throws on import in an RSC. Which hooks, and why `@vegastack/design/theme-scope` is a separate subpath: `component` skill § 3.
- **Accessibility** — WCAG 2.2 AA while preserving every existing 2.1 assertion; visible `:focus-visible` (text-entry fields use a border tint instead); must pass `axe`; every applicable state implemented — default, hover, focus, loading, empty, error, success, disabled.

## Single source of truth

Every component exists in three synced places — canonical `packages/ui/registry/ui/<name>.tsx` (**EDIT THIS**), the byte-for-byte docs copy-in `apps/docs/components/ui/<name>.tsx`, and the built item `apps/docs/public/r/<name>.json` carrying `meta.integrity`. Both generated halves are committed, and `pnpm registry:build` (validate → build → stamp → header → verify-headers → verify-registry-deps) regenerates them idempotently and fully locally. The copy-in dogfoods `shadcn add` — proven by `verify-shadcn-consume.mjs` running the real CLI — so do not replace it with an alias or a symlink without reopening the locked distribution decision, and never fix component styling in a `preview/*.tsx`, which only composes; and **not everything generated is committed**: the home catalog and the animated-icon gallery are build outputs — gitignored, listed in `tooling/lib/derived-build-outputs.mjs`, written by `apps/docs`'s `prepare:content` — so never stage one, because `design:derived:check` ignores them and `tooling/verify-component-contracts.mjs` regenerates and reconciles them instead.

| Authority                              | Regenerate with                        | Generated output                                                                               |
| -------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `packages/ui/registry/ui/*`            | `pnpm registry:build`                  | docs copy-in, `public/r/*.json` — committed                                                    |
| `packages/ui/component-contracts.json` | `pnpm design:derived`                  | matrix, public skill roster, § Numbers, README § Inventory — committed; plus two build outputs |
| `.changeset/*.md`                      | `node tooling/changelog-assemble.mjs`  | the `/CHANGELOG.md` release entry, at version time only                                        |
| `/CHANGELOG.md`                        | `node tooling/sync-changelog.mjs`      | the docs Changelog page                                                                        |
| `skills/public/**`                     | `node tooling/sync-package-skills.mjs` | `packages/design/skills/**`, shipped inside the npm package                                    |
| `design.md`                            | `pnpm design:sync`                     | its derived doc surfaces                                                                       |

## Verification — three loops

```bash
pnpm check:component <name>   # ~10s    design-lint · typecheck · that one component's test
pnpm verify                   # ~2m on the Mac; ~2m50 on the Linux runner, ~1m40 for the macOS static half
pnpm verify:release           # ~7m     the deploy-only extras, on top of verify
pnpm run clean                # report only; --after-run / --weekly reclaim, --dry-run never removes
```

`pnpm verify` (`tooling/verify.mjs`) is typecheck → lint → `design:verify` → the `@vegastack/ui` browser suite (unit, axe, geometry contracts) plus the `@vegastack/design` CLI node tests, run through turbo so `^build` produces the dists the suite imports. It is byte-for-byte what `ci.yml`, `release.yml`, and `deploy.yml` run on the LAN Linux runners in the pinned Playwright container, so a green run here and a green check there are the same evidence; it ends by running `tooling/workspace-clean.mjs --after-run` on pass, fail, or interrupt while preserving the run's exit code, so even a failed run leaves a clean tree. `pnpm verify:release` adds what only an outward step needs — the docs export in BOTH `SITE_VISIBILITY` matrices with their metadata contracts, the link check, the docs-shell contracts over that export and their self-test, `registry:build` and its idempotency assertion, the real `shadcn add` consume round-trip, and the complete suite in all three engines — and `deploy.yml` runs it before anything outward happens. **What they prove:** every check they name was executed against this tree. **What they never prove:** that a layout is right (no lane takes a screenshot — a person looks), that prose is still true (`design:sync:check` gates only design.md's derived surfaces), or that a claim in a comment, a plan, or a workflow condition holds — execute it. `pnpm lint` is the static umbrella: shadcn base check, skill lint, the public-skill mirror, changeset lint, security boundaries, workflow security and its negative harness, secret scan, the `tooling` vitest project, `design:verify`, then `turbo run lint`. Every gate fails closed, and the gates that would otherwise never be observed failing have negative harnesses — `verify-design-lint-structural`, `verify-registry-integrity-negative`, `verify-workflow-security-negative`, and `verify-docs-shell --self-test`.

**Two deviations from `docs/plans/2026-09-08-verification-rebuild.md`, recorded here because the plan is a point-in-time record and this file is the rulebook.** (1) The plan (§ 3.4) named `tooling/test/playwright-image-pin.test.mjs`; **that file was never written and must not be.** The invariant it described is enforced instead inside `tooling/verify-workflow-security.mjs`, which derives the container tag from the `playwright` version in `pnpm-lock.yaml` and rejects any second literal copy of it — one authority, checked in `pnpm lint`, so a separate test would only be a third place to drift. (2) The plan (§ 3.3, § 4 WP3) listed `tooling/verify-workflow-security-negative.mjs` for DELETION; it was **kept, expanded, and wired into `pnpm lint`** instead. A gate nothing ever observes failing is indistinguishable from a gate that cannot fail, and the workflow-security gate is exactly that kind — so the negative harness is a locked property of the verification set, not a leftover.

**Per PR: four artefacts** — the component source, its test, its MDX page, and a changeset whose body opens with one section marker. **Per wave or release, in a PR that touches nothing else:** `design.md`, skills plus their mirror, the ledgers, and this file. `design:sync:check` and `design:derived:check` run on every PR; they fail only when code and doctrine disagree, which the wave PR resolves.

## Docs authoring

A component page is part of the component, not a follow-up, and it serves humans and agents from the same source. **The page canon — section order, what each section must contain, and which authority generates it — is `design.md` § Docs canon**; read that table before writing or changing a page. Not negotiable from anywhere: sections appear in the canon's order and nothing follows Do/Don't except the generated Changelog; the machine-readable half of a section is generated (`InstallSteps`, `Anatomy`, `ApiTable`, `StatesTested`, `ComponentChangelog`), never typed; an API table lists own props only, expanded, with the literal union, and a part with no own props gets one sentence rather than placeholder rows; the Story explorer appears only where no curated playground does (DD-3). Register the page in `apps/docs/content/docs/components/meta.json`, re-export the preview from the barrel, and add the component's record to `component-contracts.json`. No `{@link}` — MDX parses `{…}` as JS. `tooling/content-lint.mjs` rejects skipped visual tests and `tooling/verify-docs-export.mjs` rejects a page whose markdown export still carries JSX or an empty API table. Guides live in `apps/docs/content/docs/guides/`; unlisted/noindex operations guides live in `apps/docs/content/internal/` and are public by policy though excluded from discovery.

## Review, and releasing

The `review` skill covers both halves of a round: **audit** is deterministic — run `pnpm verify`, read the one report, then triage against the design-lint rule set — and **adversarial review** hunts what no gate can see (false coverage claims, fail-open gates, stale generated files). Verify every claim by execution, classify high/medium/low, fix at the root, and record the round in `docs/ledger/codex-rounds.md`, `bugs.md`, and `operator-review.md`. Run both before shipping anything user-visible. Read the `ship` skill for the release procedure; `docs/RELEASING.md` is the reference for the topology. Before touching anything:

- **Shipping is always MK's decision.** Agents prepare; they never push a changeset-bearing commit, merge the Version PR, or dispatch `deploy.yml` without an explicit "yes proceed" for _that step_.
- **Each outward step is its own approval.** Required-reviewer environments are unavailable on this plan, so the reviewed change PR, the merge of the Version Packages PR (which authorizes npm publication), and the manual Deploy dispatch (which authorizes the registry/docs release) are the boundaries. MK may be the actor; the decision is still separate each time. **Per PR the only changelog artefact is a changeset**, carrying exactly one section marker (`🧩/🔧/🗑/🛠/📦/📚/🐛/⚠️`) as enforced by `tooling/changeset-lint.mjs`. Nobody hand-edits `/CHANGELOG.md` between releases, and nobody ever touches the generated docs page.
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

- **Registry items: 560** — 113 components · 439 animated icons · 7 hooks (`use-animation-replay`, `use-announcer`, `use-drag-reorder`, `use-file-drop`, `use-list-nav`, `use-mobile`, `use-platform`) · 1 block (`dashboard-01`)
- Contract SHA-256: `9ff46ff7b47fd1786462830550a299edbc4f0d3867ec1cf9b847f7e920491ffd`

<!-- NUMBERS:END -->

## Escalation

- **Needs MK, always** — any outward step (pushing a changeset-bearing commit, merging a Version PR, dispatching a deploy, changing Cloudflare Access) and any new sanctioned dependency exception.
- **A rule here conflicts with a skill** — the skill is more specific and usually newer; follow it and flag the conflict so one of them gets fixed. Never silently pick one.
- **A rule conflicts with the code** — the enforcing script is ground truth over any prose, including this file. Fix the prose.
- **Something is genuinely missing or ambiguous** — stop and ask. Do not invent a decision, and do not re-open a locked one to work around a blocker.

# AGENTS.md — vegastack-design

VegaStack's internal design system: Base UI + Tailwind v4 + OKLCH semantic tokens, distributed as
two public npm packages plus a private, Sigstore-signed shadcn registry. Consumed by humans and by
agents (Claude Code, Codex).

**This file is loaded into every session.** It holds the rules you can break before loading anything
else, the map, and a router. Procedures live in skills, loaded on demand.

**Status:** shipped and live on public npm via OIDC trusted publishing (tokenless). Production docs
and registry at `design.vegastack.com` remain behind Cloudflare Access until the separately approved
public-docs cutover. Operating mode: **build local; publishes and deploys go through the `ship`
skill.** For actual versions, ask the registry and the workspace rather than any document:

```bash
npm view @vegastack/design version                              # what consumers have
node -p "require('./packages/design/package.json').version"     # what this tree would publish
```

## Truth hierarchy

When two sources disagree, the higher one wins. This ordering matters more than any individual rule
below, because most wrong answers come from trusting a document that stopped being true.

1. **The source and the scripts that enforce it** — `packages/ui/registry/ui/*`,
   `tooling/design-lint.mjs`, and the `verify-*`/`sync-*` gates. If prose disagrees with an enforcing
   script, the script is right and the prose is a bug.
2. **Machine authorities** — `packages/ui/component-contracts.json` and `packages/ui/registry.json`
   for inventory, membership, and counts. Never quote a count from prose.
3. **Official docs for the version actually installed** — Base UI, Tailwind v4, shadcn, Next, React.
   Check `package.json`/the lockfile for the real version, then read that version's docs. These
   libraries change under us; recalled API knowledge is frequently a version behind.
4. **`design.md`** — the canonical design doctrine, and a _living_ document: it is gated by
   `pnpm design:sync:check`, so it must be brought forward whenever the system's direction changes.
   A change to component direction that leaves `design.md` behind is an incomplete change.
5. **This file** — always-on rules, the map, the router.
6. **Skills** — procedures, loaded on demand. More specific and usually newer than this file.

**Everything under `docs/plans/`, `docs/gap-analysis.md`, `docs/audits/`, and `docs/requirements.md`
is a point-in-time record.** They say what was believed and decided on a given date — several
declare themselves "preserved as the historical record" — and they are the right place to answer
_"why was this chosen, back then"_. They are **not** a source of current behaviour, current package
names, current counts, or current APIs. Do not cite them as evidence that something is true today;
confirm against 1–4 first. Locked decisions stay locked regardless of where they are written down.

## The five non-negotiables

1. **Edit the canonical source only.** Every component exists in three places; two are generated.
2. **Semantic tokens only.** No hex, no px, no raw Tailwind palette, anywhere in component source.
3. **Server-safe by default.** `'use client'` only at the lowest interactive leaf.
4. **Never hand-edit a generated file.** If a file says GENERATED, change its authority and rerun.
5. **Shipping is always MK's decision.** Prepare and stop. Approval for one step is never approval
   for the next.

## Task router

| You are about to…                                          | Do this                                                                                  |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Add or change a component, hook, or block                  | Load the **`component`** skill                                                           |
| Review or audit this repo — gates, compliance, drift, bugs | Load the **`review`** skill                                                              |
| Release, publish, deploy, or write a changelog entry       | Load the **`ship`** skill                                                                |
| Plan a non-trivial change                                  | Write a plan to `docs/plans/`, present it, wait for approval (§Planning)                 |
| Write or change a docs page                                | §Docs authoring below, then the `component` skill §6                                     |
| Understand what a component does                           | `docs/ledger/component-matrix.md`, or the MDX page                                       |
| Know the current counts                                    | §Numbers below — generated from the contract; never quote a count from prose             |
| Answer "why was this chosen"                               | The point-in-time record in `docs/` — see §Truth hierarchy before trusting it as current |
| Find a past bug or judgment call                           | `docs/ledger/bugs.md` · `docs/ledger/operator-review.md`                                 |

Skills live in `skills/{internal,public}/`, symlinked into `.claude/skills/` (Claude Code) and
`.agents/skills/` (Codex). Both agents load a skill automatically when the task matches its
description; Claude Code additionally accepts `/<directory-name>` to invoke one directly. Load the
skill rather than working from this file's summary — the summary is deliberately lossy.
See `skills/README.md` for the audience split and the rules that govern it.

## Locked decisions

Do not re-open these. The original rationale is in `docs/requirements.md` §3 and
`docs/gap-analysis.md` — historical records, so read them for _why_, never for _what is true now_.

- **Stack** — `@base-ui/react` primitives via shadcn `--base base`; Tailwind v4; Next 16; React 19;
  Node ≥24.14; pnpm 11; Turborepo 2.
- **Distribution is hybrid** — public npm (`@vegastack/design` + zero-dep
  `@vegastack/design-tokens`) plus a private shadcn registry for components (copy-in).
- **Component model A (own it), no `Vega*` prefix** — export `Button`, not `VegaButton`. There is no
  pristine-shadcn tier; `shadcn add --diff` surfaces upstream changes for deliberate cherry-pick.
- **The provider ships as a registry item** — `shadcn add @vegastack/provider` is the sanctioned
  install path. The `@vegastack/ui` provider is a documented mirror of the canonical registry source.
- **Tokens** — DTCG → Style Dictionary (custom `color/oklch` transform, separate light/dark builds,
  `@theme inline` bridge). Runtime font/ease vars are `--font-family-*` / `--motion-ease-*`, never
  self-referential.
- **Docs** — Fumadocs, static export to Cloudflare Workers Static Assets. Storybook is deferred.
- **Visual verification is split in two** (reversed 2026-07-25 from "VRT is day-one"; evidence in
  `docs/ledger/operator-review.md`). **Behaviour** is a CI gate: `apps/docs/vrt/contracts.spec.ts`
  proves 320px reflow, RTL containment, forced-colors focus, and effective 24px pointer targets on
  every component route, takes no screenshots, and needs no baselines. **Pixels** are a local review
  step: `node tooling/vrt-review.mjs` captures the base ref and the working tree on one machine and
  emits a before/after report a human reads during `/ship`. No screenshot is ever committed.
- **Non-browser CI runs on the self-hosted mac minis** — `runs-on: [self-hosted,
  vsk-runners-mac-mini]` for `release.yml`'s `changes` and `version-pr` and `deploy.yml`'s
  `ref-guard` and `build-curated`. The split is an enforced allowlist in
  `tooling/verify-workflow-security.mjs`, not a convention, and `ubuntu-latest` is required for four
  reasons: **browsers** (`ci.yml` entirely, plus `contracts-gate` in both workflows and
  `quality-gate`) — the minis cannot launch Chromium, see below; **npm OIDC** (`publish`) — trusted
  publishing does not support self-hosted runners and this repository holds no `NPM_TOKEN`;
  **credentials without repository code** (`sign-curated`, `deploy-curated`); and **network
  position** — `deploy.yml`'s three boundary probes must originate OUTSIDE VegaStack's network or
  Cloudflare device posture could authenticate a request they assert is anonymous.
  Job containers are banned on the self-hosted jobs — Linux-only, they cannot start on macOS — but a
  GitHub-hosted job may use one when render determinism needs it, digest-pinned: `quality-gate` runs
  the three-engine suite in the pinned Playwright image because bare `ubuntu-latest` WebKit could not
  settle the compiled-CSS Toaster contrast check.
- **The minis cannot run browsers today, and it is a host bug.** Their Actions runner has no
  per-user Mach bootstrap namespace, so every Chromium launch dies with `bootstrap_look_up
  org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP —
  deterministic on both minis across all retries in run `30131471680`, while the identical suite
  passes locally on the same OS and CPU. Fix is on the host: reinstall the runner as a **LaunchAgent
  in a logged-in session** rather than a LaunchDaemon. After that, move the five browser jobs back by
  editing `GITHUB_HOSTED_JOBS`; nothing else in the repository changes.
- **Registry integrity** — whole-item SHA-256 in `meta.integrity`, a Sigstore-signed manifest
  (GitHub OIDC), and a fail-closed consume preflight.
- **Auth topology (approved target)** — public human docs anonymous; `/internal/*` SSO;
  `/r/*` registry service-token only. `SITE_VISIBILITY` controls discovery metadata only, never
  authorization.

### Sanctioned dependency exceptions

Adding to either list needs MK sign-off, tracked the same way.

- **Headless primitive** — `@shadcn/react/message-scroller` (MessageScroller) is the ONLY non-Base-UI
  headless primitive. Nothing else.
- **Renderer / behavior engines** — `react-resizable-panels`, `recharts`, `motion`, `tiptap`, and the
  pre-existing `sonner`. Each is named per-component in `packages/ui/registry.json`. These render or
  animate; they do not own interaction semantics, which is why they are a narrower class than the
  primitive exception above.

## Build rules

Enforced by `tooling/design-lint.mjs` and the `review` skill. Full token vocabulary:
`skills/internal/component/references/tokens.md`. Rule-by-rule explanations:
`skills/internal/review/references/lint-rules.md`.

- **Colour** — semantic tokens only (`bg-primary`, `text-muted-foreground`, `border-border`). No hex,
  no raw palette. `text-muted-foreground-faint` is sub-AA: placeholder and disabled copy only.
- **Size** — `--size-*` for control heights, `--icon-*` for icon sizes. Never pass `size`/`width`/
  `height` directly to a lucide component.
- **Radius** — caps at `rounded-lg`. `rounded-xl` was removed and is banned.
- **Alpha vs. opacity** — different roles, not interchangeable. Colour compositing takes `--alpha-*`;
  whole-element opacity takes `--opacity-*`. Never a raw `/NN` or `opacity-NN`.
- **Z-index** — two bands: `z-(--z-raised)`, `z-(--z-overlay)`. No raw `z-N`.
- **Type** — the weight ladder is 400/500; `font-bold`/`font-semibold` are banned. Letter-spacing,
  blur, and shadow are owned by named roles — raw `tracking-*`/`blur-*`/`shadow-*` are banned.
  `text-4xl`+ is off-scale; use the display tier. **Uppercase is mono-exclusive** and ≤14px.
- **Motion** — `duration-fast/base/slow` paired with `ease-standard/emphasized/exit/spring` in the
  same class literal, or `motion-pop-in`/`motion-enter-up`/`motion-shake`/`motion-flash`. No raw `duration-[…]`/`ease-[…]`/
  `cubic-bezier()`. `animate-spin`/`animate-pulse` are the one loader exception. Colour changes are
  immediate: `transition-colors` and `transition-all` are banned.
- **Structure** — CVA for variants; `cn()` from `@vegastack/design`; `data-*` for state; ref-as-prop
  (React 19 — never `React.forwardRef`); Base UI `render` for composition (single-polymorphic-root
  components must not `Omit<…, 'render'>`).
- **Icons** — `lucide-react`, the lucide-animated mirrors, and `thesvg` via `Icon`/`BrandIcon`. No
  other library, no inline `<svg>` as an icon. Icon registry items install as
  `@vegastack/icon-<name>`; the bare name is reserved for components, so `icon-button` is a component.
- **Responsive** — `min-w-0` on a truncating flex child, with `truncate` on an inner span, never on
  the same element as `flex`. Touch targets ≥24px via an invisible hit area, verified with a real
  `elementFromPoint` probe rather than `getComputedStyle`.
- **Layout** — compose `AppShell` (`packages/ui/registry/ui/app-shell.tsx`) rather than hand-rolling
  a sidebar + header + main shell. It owns the landmark trio, the skip link, and the content
  container query.
- **Server-safe by default** — a _runtime_ claim enforced by `tooling/verify-rsc-safety.mjs`, not a
  style preference: under the `react-server` condition most React hooks are `undefined`, so touching
  one without `'use client'` throws on import in an RSC. Which hooks, and why
  `@vegastack/design/theme-scope` is a separate subpath: `component` skill §3.
- **Accessibility** — WCAG 2.2 AA while preserving every existing 2.1 assertion. Visible
  `:focus-visible` (text-entry fields use a border tint instead). Must pass `axe`. Every applicable
  state implemented: default, hover, focus, loading, empty, error, success, disabled.

## Single source of truth

Every component exists in three synced places. **Edit one; a script regenerates the rest.**

| Place         | Path                                 | Status                              |
| ------------- | ------------------------------------ | ----------------------------------- |
| Canonical     | `packages/ui/registry/ui/<name>.tsx` | **EDIT THIS**                       |
| Docs copy-in  | `apps/docs/components/ui/<name>.tsx` | generated, byte-for-byte            |
| Registry JSON | `apps/docs/public/r/<name>.json`     | generated, carries `meta.integrity` |

```bash
pnpm run registry:build   # validate → build → stamp → header → verify-headers → verify-registry-deps
```

Idempotent and fully local. The copy-in exists to dogfood the `shadcn add` distribution (proven by
`verify-shadcn-consume.mjs` running the real CLI) — do not replace it with a path alias or symlink
without reopening the locked distribution decision. `preview/*.tsx` files only compose components;
never fix component styling there.

The same discipline governs every other generated surface:

| Authority                              | Regenerate with                        | Generated output                                                                          |
| -------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| `packages/ui/registry/ui/*`            | `pnpm registry:build`                  | docs copy-in, `public/r/*.json`                                                           |
| `packages/ui/component-contracts.json` | `pnpm design:derived`                  | component matrix, contract routes, home catalog, the public skill roster, this file's §Numbers |
| `/CHANGELOG.md`                        | `node tooling/sync-changelog.mjs`      | the docs Changelog page                                                                   |
| `skills/public/**`                     | `node tooling/sync-package-skills.mjs` | `packages/design/skills/**` (shipped in npm)                                              |
| `design.md`                            | `pnpm design:sync`                     | its derived doc surfaces                                                                  |

## Workflows

### Planning

Plan before implementing anything non-trivial. Write the plan to `docs/plans/`, present it, and wait
for explicit approval before writing code. A plan states scope, non-goals, the verification that will
prove it worked, and the risks. Historical plans stay — they are the decision record, not clutter.

### Verification ladder

Run the cheapest gate that can disprove your change, then widen.

```bash
node tooling/design-lint.mjs packages/ui/registry   # token + AST rules on component source
pnpm typecheck                                       # workspace-wide
pnpm test                                            # browser-mode unit + axe
pnpm --filter @vegastack/ui test:smoke               # WebKit + Firefox, contract-selected subset
pnpm --filter @vegastack/docs test:contracts         # 768 behaviour contracts — the CI visual gate
pnpm lint                                            # the full gate chain — see package.json
pnpm registry:build && git status --porcelain        # must be idempotent: clean tree after
pnpm design:derived && git status --porcelain        # contract-derived surfaces must be current
node tooling/vrt-review.mjs                          # before/after pixels — review, not a gate
```

`pnpm lint` is the umbrella: shadcn base check, skill lint, the public-skill mirror, security
boundaries, workflow security, secret scan, `design:verify` (token build, design.md sync, contract
reconciliation, public API docs, animated icons, theme parity, portal theme scope, **RSC safety**,
toaster mirror, structural design-lint, negative registry-integrity fixtures), then per-package lint.

Every gate fails closed. A gate that has never been observed failing is an assumption — that is why
`verify-design-lint-structural.mjs` and `verify-registry-integrity-negative.mjs` exist.

**The component contract suite is the blocking visual-surface gate.**
`apps/docs/vrt/contracts.spec.ts` runs 768 checks over every component route — 320px reflow, RTL
containment, forced-colors focus visibility, effective 24px pointer targets — in `ci.yml` on every PR
and in `release.yml` when the visual surface changed. It takes no screenshots and needs no baselines,
so it runs on any OS and cannot be cleared by regenerating its own evidence.

```bash
cd apps/docs && pnpm exec playwright test contracts.spec.ts   # or: pnpm --filter @vegastack/docs test:contracts
```

**Pixel comparison is a local `/ship` step, not a gate.** `node tooling/vrt-review.mjs` captures the
affected routes at the branch's merge-base and again at the working tree, on one machine minutes
apart, then writes `.vrt-review/report.json` plus before/after/diff PNGs. Only routes the change can
reach are captured; a change touching no visual surface captures nothing and reports SKIPPED. It
exits 0 for any pixel outcome and 2 only when it could not produce a report — a pixel difference is
not a defect, and only a human can say whether it was intended. Procedure: the `ship` skill.

Nothing enforces layout drift in CI. That is the accepted cost of removing a gate whose only escape
hatch was overwriting the evidence under review, on a team with no shared platform to regenerate
baselines on. Revisit if several people begin merging component changes independently — the
before/after tool can be pointed at a PR's base ref with no redesign.

Cross-browser policy: every PR runs the full Chromium suite plus the contract-selected WebKit/Firefox
risk smoke; main and release additionally run the complete suite in all three engines. Add a smoke
file only for motion or another evidenced cross-engine risk.

### Docs authoring

A component page is part of the component, not a follow-up. Section order is Installation → Usage →
Examples → API Reference → Accessibility → Do/Don't, plus Anatomy for compound components. Register
the page in `apps/docs/content/docs/components/meta.json`, re-export the preview from the barrel, and
add the component's record to `component-contracts.json` so its contract route is generated. No
`{@link}` — MDX parses `{…}` as JS. `tooling/content-lint.mjs` rejects skipped visual tests. Guides
pages live in `apps/docs/content/docs/guides/`; the SSO-gated internal guides live in
`apps/docs/content/internal/`.

### Review and audit

The `review` skill covers both halves. **Audit** is deterministic — run the gates, triage against
the 34-rule set. **Adversarial review** hunts what no gate can see: false coverage claims, fail-open
gates, stale generated files. Verify every claim by execution, classify high/medium/low, fix at the
root, and record the round in `docs/ledger/codex-rounds.md`, `bugs.md`, and `operator-review.md`.
Run both before shipping anything user-visible.

### Releasing

Read the `ship` skill; `docs/RELEASING.md` is the reference. The parts you must know before you touch
anything:

- **Shipping is always MK's decision.** Agents prepare; agents never push changeset-bearing commits,
  merge the Version PR, or dispatch `deploy.yml` without an explicit "yes proceed" for _that step_.
- **GitHub Team/private approval model** — required-reviewer environments are unavailable, so the
  workflows use the proven repository secrets and trusted-publisher identity. Review the change PR;
  merging the reviewed Version Packages PR authorizes npm publication; manually dispatching Deploy
  authorizes the registry/docs release. MK may be the actor, but each outward step still requires its
  own explicit MK decision under the `ship` skill.
- **The changelog is a system.** `/CHANGELOG.md` is canonical, with a fixed section vocabulary
  (`🧩/🔧/🗑/🛠/📦/📚/🐛/⚠️`). Edit it, run the sync, never touch the generated docs page.
- **The public-docs cutover is one-time and opt-in.** Ordinary deploys use `cutover_phase=ordinary`;
  `prepare` and `verify` are separate dispatches with the Access change between them. Runbook:
  `docs/plans/public-docs-cutover.md`.
- **Registry updates are pulled, never pushed.** Downstream: `check-updates` → `--diff` →
  `--overwrite`. Status is by integrity hash, so a component reads `up to date` when the global
  version bumped but its content did not change.

## Repo map

```
packages/
  design-tokens/   zero-dep DTCG token contract (theme/base/utilities CSS + JSON)
  design/          cn() · icon runtime · Tailwind v4 preset · vegastack-design CLI · shipped skills
  ui/              PRIVATE registry workspace — canonical component sources + registry.json
apps/docs/         Fumadocs showcase, guides, and the registry host (public/r)
tooling/           registry hashing/verification · design-lint · content, changelog, skill lints
skills/internal/   maintainer skills (never published)
skills/public/     consumer skills (mirrored into @vegastack/design)
docs/              requirements · gap analysis · plans · ledgers · research
.github/workflows/ ci · release · deploy
```

`packages/ui/registry/ui/` holds components and hooks; `packages/ui/registry/blocks/` holds
copy-once starter compositions. Registry item types beyond `registry:ui`: `registry:hook` for a pure
hook (plain `.ts`, no `.tsx`) and `registry:block` for a starter the consumer owns after install
rather than tracking for updates.

**Reference repos** — read these rather than re-deriving: `~/code/references/fumadocs`,
`~/code/engg-vegastack-platform`, `~/code/references/resend-design-skills`. The **reference
consumer**, and the executable ground truth for every guide claim, is
`~/code/vegastack-design-starter` (local-only; consumes production npm + registry; its smoke suite is
the contract).

## Numbers

`packages/ui/component-contracts.json` is the machine authority;
`tooling/verify-component-contracts.mjs` fails on any missing or duplicate reconciliation. The block
below is generated — never hand-edit it, and never quote a count from memory.

<!-- NUMBERS:START — generated by tooling/sync-component-derived.mjs from packages/ui/component-contracts.json. DO NOT EDIT. -->
- **Registry items: 538** — 96 components · 439 animated icons · 2 hooks (`use-animation-replay`, `use-mobile`) · 1 block (`dashboard-01`)
- Contract SHA-256: `ae248887a277e3e93c78e5d48a1c9e533003e0c9ee415fd50193e58137ed8493`
<!-- NUMBERS:END -->

Everything else is volatile and has a command instead of a number: docs pages
(`find apps/docs/content -name '*.mdx' | wc -l`), registry items served
(`ls apps/docs/public/r/*.json | wc -l`).

## Escalation

- **Needs MK, always** — any outward step (push a changeset-bearing commit, merge a Version PR,
  dispatch a deploy, run the public-docs cutover, change Cloudflare Access), and any new sanctioned
  dependency exception.
- **A rule here conflicts with a skill** — the skill is more specific and usually newer; follow it,
  and flag the conflict so one of them gets fixed. Never silently pick one.
- **A rule conflicts with the code** — the enforcing script is ground truth over any prose, including
  this file. Fix the prose.
- **Something is genuinely missing or ambiguous** — stop and ask. Do not invent a decision, and do
  not re-open a locked one to work around a blocker.

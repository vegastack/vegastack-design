# AGENTS.md — vegastack-design

VegaStack's design system: **shadcn `base-nova`** (Base UI + Tailwind v4) with OKLCH semantic tokens.
It ships as two public npm packages (`@vegastack/design`, `@vegastack/design-tokens`) plus a private,
Sigstore-signed shadcn registry at `design.vegastack.com/r/*` (Cloudflare Access service token). The docs
site is public. Humans, Codex and Claude Code follow the same files:

- **This file** — the always-on rules and the map. Short on purpose.
- **[`docs/RUNBOOK.md`](docs/RUNBOOK.md)** — how to change, check, review, release, deploy, recover and pull
  into an app. **The one procedure document**; skills link to it rather than restating it.
- **[`docs/decisions.md`](docs/decisions.md)** — locked decisions, sanctioned dependency exceptions and the
  full build rules with their rationale. Read it before touching an area it covers.
- **Skills** (`skills/internal/{component,review,ship}`, symlinked into `.claude/skills/` and
  `.agents/skills/`) — task procedures, loaded on demand.

For versions, ask rather than recall: `npm view @vegastack/design version` (what consumers have) and
`node -p "require('./packages/design/package.json').version"` (what this tree would publish).

## Operator review policy

<!-- operator-review-policy: codex-reviews -->

Independent reviews use Codex (cross-agent) in this project. If Codex is unavailable, say so and use a
Claude subagent review instead; never skip the review.

## Authorization

- **Operator, 8 October 2026:** reviewed PRs (CI green, review per policy) merge into `main` without a
  per-change ask, and a merge releases (npm publish, registry and docs deploy) so consuming apps can pull
  it. This supersedes the 3 October "ship it" wording.
- **Always stop for MK:** secrets, Cloudflare Access or auth policy, workflow permission expansion, runner
  trust, destructive data, version reversal, a new sanctioned dependency, a new row on the shadcn-reset
  decision register (never invent an ID; `A11Y-14`/`A11Y-15` are burned), and a shadcn CLI version move.
- A rule here that conflicts with a skill or the code: the enforcing script wins over prose, then the more
  specific skill. Fix the loser in the same PR; never silently pick one.

## Truth hierarchy

1. The source and the scripts that enforce it (`vendor/shadcn/4.21.0/`, `packages/ui/registry/**`,
   `packages/ui/upstream/**`, `tooling/*`). Prose that disagrees with a gate is a bug in the prose.
2. Machine authorities: `packages/ui/registry.json`, `packages/ui/component-contracts.json`,
   `packages/ui/upstream/decisions.json` (+ `exception-map.json`, `ours.json`, `excluded.json`). Never
   quote a count from prose; run the command.
3. Official docs for the **installed** versions (check `package.json`/lockfile first).
4. `design.md` — the living design doctrine, gated by `pnpm design:sync:check`. A change of direction
   updates it in the same PR.
5. This file, then skills. `docs/plans/`, `docs/audits/`, `docs/ledger/`, `docs/research/` and
   `docs/archive/` are point-in-time records: read them for _why_, never as current behaviour.

## The five non-negotiables

1. **Edit the canonical source only.** A component shadcn ships is `vendor/shadcn/4.21.0/ui/<name>.tsx`
   verbatim plus an approved patch; every difference names an **ours** decision ID. A difference with no
   decision row is a stop-and-ask.
2. **Semantic tokens only.** No hex, no px, no numbered Tailwind palette in component source.
3. **Server-safe by default.** `'use client'` only at the lowest interactive leaf.
4. **Never hand-edit a generated file.** Change its authority and rerun the generator (table below).
5. **One edit point per change.** Source, its test, its MDX page and a changeset travel together; doctrine
   (`design.md`), skills and docs move in the same PR as the behaviour they describe.

## Build rules (one line each; detail and rationale in `docs/decisions.md` § Build rules)

- Colour: semantic tokens; status colour has two inks: `<family>-foreground` on the solid fill,
  `<family>-text` on page and tint (A11Y-13). `contrast-check.mjs` gates it.
- Focus: no focus rings anywhere (FOC-13); a background tint is the cue; a border never changes colour on
  focus except text entry, which darkens to `border-ring/50` (FOC-14).
- Size, radius, shadow, z-index, alpha, opacity are plain Tailwind; `z-50` is the one overlay band
  (toasts `z-60`, OVL-15).
- Type: Tailwind's stock sizes with our global heading tracking ramp; no `tracking-*` except
  `tracking-widest`, no arbitrary text sizes, no uppercase transform (TYP-15, TYP-7). Fonts: Geist.
- Motion: upstream vocabulary is legal; our motion tokens only for keyed-presence utilities.
- Structure: CVA variants, `cn()` from `@vegastack/design`, `data-*` state, ref-as-prop (React 19), Base UI
  `render`; icons via `lucide-react`, the lucide-animated mirrors, and `Icon`/`BrandIcon`.
- Layout: `min-w-0` on truncating flex children; touch targets ≥24px.
- Our components carry JSDoc plus `@example` per exported part; upstream-backed ones document on their page.
- Accessibility: WCAG 2.2 AA, axe-clean, every applicable state implemented.
- Dependencies: only the sanctioned engines in `docs/decisions.md` § Sanctioned dependency exceptions,
  each imported by exactly one registry file. A new one is an MK decision.

## Generated surfaces

`pnpm gen` runs every generator below in order (about 5 s); the pre-commit hook runs it when you stage an
authority, and CI fails only if it would still change the tree.

| Authority                              | Regenerate with                        | Output                                                           |
| -------------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| `packages/ui/registry/ui/*`            | `pnpm registry:build`                  | docs copy-in `apps/docs/components/ui/*`, `apps/docs/public/r/*` |
| `packages/ui/component-contracts.json` | `pnpm design:derived`                  | matrix, skill roster, README inventory, page `status`/`since`    |
| `.changeset/*.md`                      | release (`changelog-assemble`)         | `/CHANGELOG.md` and the docs changelog page                      |
| `skills/public/**`                     | `node tooling/sync-package-skills.mjs` | `packages/design/skills/**`                                      |
| `design.md`                            | `pnpm design:sync`                     | its derived doc surfaces                                         |

## Task router

| You are about to…                          | Do this                                                        |
| ------------------------------------------ | -------------------------------------------------------------- |
| Add or change a component, hook or block   | `component` skill (first question: does upstream ship it?)     |
| Review or audit                            | `review` skill                                                 |
| Release, deploy, recover, pull into an app | `docs/RUNBOOK.md` (the `ship` skill points there)              |
| A red CI run                               | read the named failing stage; `docs/RUNBOOK.md` § What CI runs |
| Write a docs page                          | `design.md` § Docs canon, `docs/decisions.md` § Docs authoring |
| "Why does this differ from shadcn?"        | `packages/ui/upstream/decisions.json`                          |

## Repo map

```
packages/design-tokens/  zero-dep DTCG token contract (theme/base/utilities CSS + JSON)
packages/design/         cn() · icon runtime · Tailwind preset · vegastack-design CLI · shipped public skills
packages/ui/             private registry workspace — canonical sources, tests, contracts, registry.json
packages/ui/upstream/    patches · decisions.json · exception-map.json · ours.json · excluded.json
vendor/shadcn/4.21.0/    pristine pinned upstream — never hand-edited, hashed in its manifest.json
apps/docs/               Fumadocs site and the registry host (public/r)
tooling/                 verify.mjs (the one check command) · upstream/ · registry hashing · design-lint · test/
skills/                  internal/ maintainer skills · public/ mirrored into @vegastack/design
docs/                    RUNBOOK · decisions · runbooks/ (machines) · historical plans, audits, ledgers, archive
.github/workflows/       ci · release · deploy · full-suite
```

Commits use a conventional prefix (`feat(ui):`, `fix(ui):`, `chore(ci):`, `docs:` …), enforced by the
`commit-msg` hook. Never `git stash` in this repo; use a worktree.

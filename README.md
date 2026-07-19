# VegaStack Design

VegaStack's internal design system: **75 components** (Base UI + Tailwind v4, WCAG 2.1 AA,
semantic-token-only), 440 animated-icon items, hooks, and a starter block — distributed
**hybrid**: two public npm packages + a private, Sigstore-signed shadcn registry.

| Surface | Where |
| --- | --- |
| Docs, showcase & guides | **https://design.vegastack.com** (SSO) |
| Component registry | `https://design.vegastack.com/r/*` (Cloudflare Access service token) |
| npm | [`@vegastack/design`](https://www.npmjs.com/package/@vegastack/design) · [`@vegastack/design-tokens`](https://www.npmjs.com/package/@vegastack/design-tokens) |
| Release history | [CHANGELOG.md](CHANGELOG.md) (canonical → generates the docs Changelog page) |

**Consumers start at the docs** → [Quickstart](https://design.vegastack.com/docs/guides/quickstart).
This README is for maintainers of this repo.

## Repo layout

```
packages/
  design-tokens/   zero-dependency DTCG token contract (theme/base/utilities CSS + JSON)
  design/          cn() · icon runtime (./icons) · Tailwind v4 preset · vegastack-design CLI
  ui/              PRIVATE registry workspace — canonical component sources + registry.json
apps/docs/         Fumadocs showcase + guides + the registry host (public/r)
tooling/           registry hashing/signing/verify · design-lint · changelog + skill lints
skills/            agent skills (ship = the release runbook; add-component; design-audit; …)
.github/workflows/ ci · release (path-routed gates, npm OIDC) · deploy · vrt
```

Agent/project instructions: **[AGENTS.md](AGENTS.md)** (canonical — CLAUDE.md just points here).

## The one rule that prevents drift

Components exist in three synced places; **edit ONLY the canonical source**
(`packages/ui/registry/ui/<name>.tsx`) then run:

```bash
pnpm run registry:build   # regenerates docs copy-in + item JSON, re-stamps integrity
```

Never hand-edit `apps/docs/components/ui/*` or `apps/docs/public/r/*`. Same discipline for
the changelog: edit `/CHANGELOG.md`, run `node tooling/sync-changelog.mjs` — the docs page
is generated (CI fails on drift).

## Everyday commands

```bash
pnpm install
pnpm dev                       # docs showcase on :3000
pnpm lint && pnpm typecheck && pnpm test
pnpm registry:build            # after any canonical component edit
pnpm registry:verify-consume   # real `shadcn add` round-trip against the built registry
```

## Releasing

Use the **ship skill** (`skills/ship/SKILL.md` — auto-discovered by Claude Code and Codex):
preflight → changesets → changelog entry → Version PR → **npm OIDC publish** (tokenless,
2FA intact) → registry deploy → Access verification.

**Shipping is always MK's decision** — agents prepare and stop for an explicit
"yes proceed" per outward step. Full reference: [docs/RELEASING.md](docs/RELEASING.md).

## Verification culture

Fail-closed gates end to end: design-lint (token-only styling) · 1,150+ browser-mode unit
tests + axe · real-CLI consume verification (526 items × 2 layouts) · VRT pixel gate
(196 baselines, CI-container-generated) · registry integrity (SHA-256 + Sigstore) ·
changelog/skill/link lints. The **reference consumer** (`vegastack-design-starter`,
local repo) is the executable ground truth for every guide claim.

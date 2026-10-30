---
name: ship
description: Release VegaStack Design — merge a reviewed green PR, which releases by itself (version commit, npm OIDC publish, signed registry and docs deploy, production probe), recover a failed stage, and hand the release to consuming apps. Use when asked to ship, release, publish, deploy, or write a changeset.
---

# Ship VegaStack Design

The procedure is [`docs/RUNBOOK.md`](../../../docs/RUNBOOK.md); follow §§ 3–9 there and do not restate it
here. This skill only adds the release checklist:

1. The PR carries a changeset for every public package whose source changed, with one section marker
   ([references/changelog-format.md](references/changelog-format.md)).
2. UI changes were inspected in light/dark, narrow/wide, with their states
   ([references/visual-review.md](references/visual-review.md)).
3. CI is green and the review (Codex per policy) is resolved; merge the PR.
4. Watch `release.yml` and the deploy to a terminal state (`gh run watch`); a successful dispatch is not
   completion.
5. Read back `npm view @vegastack/design version`, `npm view @vegastack/design-tokens version` and the deploy
   probe; report the merged SHA, versions and probe result.
6. Tell the consuming app to pull (`pnpm ds:pull` in Regent web).

Never publish by hand: npm publication is CI-only, token-free OIDC. Recovery and its three-strike stop are in
RUNBOOK § 9.

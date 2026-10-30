# Runbook — vegastack-design

The one procedure for everyone working on this repo: humans, Codex and Claude Code. Rules live in
`AGENTS.md`; the reasons behind them live in `docs/decisions.md`. If a workflow or script disagrees with this
file, the script is right: fix this file in the same PR.

## 1. Who may do what

- A reviewed PR with green CI merges into `main` without asking (operator, 8 October 2026). The merge
  releases: npm publish, then the registry and docs deploy.
- Stop and ask MK before you touch any of these: secrets, Cloudflare Access or auth policy, workflow
  permissions, runner trust, destructive data, version reversal, a new sanctioned dependency, a new
  decision-register row, or a shadcn CLI bump (`AGENTS.md` § Authorization).
- Reviews use Codex (`codex exec … < /dev/null`). If Codex is unavailable, use a Claude subagent and say so.
- Never `git stash`. Work in a worktree (`git worktree add ../.worktrees/<name> -b <branch> origin/main`).

## 2. Setup

```bash
pnpm install          # Node 24.20.0 is pinned by devEngines; pnpm 11 via corepack
pnpm dev              # docs site with every component preview
```

Registry credentials (`CF_ACCESS_CLIENT_ID`/`_SECRET`) are needed only to consume the live registry.

## 3. Change a component

1. Load the `component` skill. Its first question is whether upstream shadcn ships the component.
2. Edit the canonical source `packages/ui/registry/ui/<name>.tsx`. For an upstream component the change
   is a patch hunk that names an **ours** decision ID; author it with `pnpm upstream:diff <name>`.
3. Update the component's test, its MDX page (`apps/docs/content/docs/components/<name>.mdx`) and
   `component-contracts.json` if its public surface changed.
4. Regenerate what you touched: `pnpm registry:build`, and `pnpm design:derived` if the contract changed.
5. Write a changeset with `pnpm changeset`. Bump every public package whose source changed, and open the
   body with one section marker: `🧩 🔧 🗑 🛠 📦 📚 🐛 ⚠️`. Wrap any `<word>` in backticks.
6. Check locally, optionally with `pnpm check:component <name>` or `pnpm check:affected`. CI is the
   authority.
7. Open a PR. Commit messages use a conventional prefix (`feat(ui):`, `fix(ui):`, `chore(ci):`, `docs:`).

For UI changes, look at the affected previews in light and dark, at 320px and wide, with their states.
Temporary captures are fine; never commit screenshots.

## 4. What CI runs and how to read a red run

`PR quality` (`.github/workflows/ci.yml`) is one job in the pinned Playwright container on the Linux
`vsk-runner` pool. It runs `pnpm verify:affected --base <base> --head <head>`, which works in stages,
each printing `finished in Ns`:

| Stage             | What it proves                                                                                            |
| ----------------- | --------------------------------------------------------------------------------------------------------- |
| typecheck         | every workspace typechecks                                                                                |
| lint              | formatting, skills, changesets, upstream parity (`upstream:check`), tooling tests, package and docs lints |
| design invariants | generated surfaces are current, contracts reconcile, tokens, RSC safety, registry integrity               |
| affected Chromium | tests for changed items, their reverse dependents, and owned geometry fixtures                            |

A red run names its stage and the failing script.

- **"stale" or "out of sync" means a generator was not run.** Run the generator from the
  `AGENTS.md` § Generated surfaces table and commit the result.
- A failing test that passes locally is a candidate flake. Rerun it once, and record it in the PR if the
  rerun passes.
- The complete component suite is manual: `gh workflow run full-suite.yml -f commit_sha=<sha> -f engines=chromium|all`.

## 5. Review

Load the `review` skill. Verify every finding by running it, fix the root cause, and re-run the gates.
Record findings in the PR. Only MK's judgement calls go to `docs/ledger/operator-review.md`.

## 6. Release

A merge to `main` starts `release.yml`:

1. With pending changesets, Changesets opens or updates the **Version Packages** PR
   (`changeset-release/main`). Its CI does not start on its own: close and reopen the PR (or approve its
   `action_required` run). Merge it when it is green.
2. That merge publishes the missing npm versions through OIDC (no token), then dispatches `deploy.yml`
   for the exact commit.
3. Deploy builds the docs and registry, signs the integrity manifest, uploads to Cloudflare, and probes
   production: `/r/*` must reject anonymous requests and accept the service token; everything else must be
   public.

Watch it through with `gh run watch`. Verify with `npm view @vegastack/design version` and the deploy run's
probe step. A registry-only release publishes no npm package, and that is expected. There are no git tags
and no GitHub releases.

## 7. Use an unreleased change in an app

On the same machine:

```bash
# design-system worktree
pnpm registry:build && pnpm -F @vegastack/docs registry:serve        # serves public/r on :4000
# app
pnpm exec shadcn add http://localhost:4000/<name>.json --overwrite
```

Never commit this into the app. The app's drift check flags it until the real release is pulled.

## 8. Pull a release into an app

In the Regent web app, run `pnpm ds:pull`. It bumps the packages, overwrites the stale registry
components, refreshes the vendored skills and runs the strict drift check. Open the result as its own PR,
`chore(ds): pull design system <version>`, right after the deploy goes green.

## 9. Recovery

- **Transient failure** (network, runner, npm, Cloudflare): rerun the failed job. Publishing skips
  versions that already exist. Rerun a deploy with
  `gh workflow run deploy.yml -f expected_sha=<main sha>`.
- **Real defect after publish:** patch forward with a fix PR and a new patch release. Never unpublish
  and never overwrite a version.
- If three corrective releases do not fix it, stop and report the live npm versions, the deployed commit,
  the failing stage and what you tried.

## 10. Runners and caches

Every job runs self-hosted on `[self-hosted, linux, vsk-runner]` (node-01/06/08, shared with the Regent
app). It runs inside `mcr.microsoft.com/playwright:v<lockfile version>-noble`, with the pnpm store mounted
from `/opt/vsk-runner/pnpm-store`. To add capacity, follow `docs/runbooks/ci-runner-provisioning-linux.md`.
`pnpm run clean` reports reclaimable build output locally.

## 11. Glossary

- **upstream:check** — vendor integrity, byte parity of patches, exception discipline, variant coverage.
- **decision register** — `packages/ui/upstream/decisions.json`; each patch hunk names an **ours** ID.
- **contracts** — `packages/ui/component-contracts.json`: inventory, ownership, public surface.
- **affected** — the changed items plus their transitive reverse dependents, from
  `tooling/affected-tests.mjs`.

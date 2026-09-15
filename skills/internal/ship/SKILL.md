---
name: ship
description: Release VegaStack Design end to end from one explicit ship instruction — affected PR proof, exact-SHA merge, direct release commit, npm OIDC publish, public registry/docs deploy, production verification, and bounded corrective retries.
---

# Ship VegaStack Design

One explicit **ship it** from MK authorizes the current reviewed change through completion: commit,
push, PR, exact-SHA squash merge, direct release commit, npm publication, public registry/docs
deployment, and production verification. Do not stop for another approval between those steps.

The authorization also covers at most three surgical corrective iterations. It never authorizes a
change to secrets, Cloudflare Access, authentication policy, workflow permissions, runner trust, a
sanctioned dependency exception, destructive data, or version reversal. Stop immediately if recovery
needs one of those.

Never publish manually. npm publication remains CI-only and token-free through OIDC trusted
publishing. A release creates no git tag and no GitHub release.

## 1. Prepare the change

Confirm the branch contains the complete source change and the correct changeset. Component changes
still regenerate their committed distribution surfaces:

```bash
pnpm registry:build
pnpm design:derived        # only when the component contract changed
pnpm check:affected        # optional fast feedback; PR CI is authoritative
git status --short
```

For UI changes, start the docs app and inspect only the affected preview modules in light and dark,
at 320px and a wide viewport, including applicable hover, pressed, focus, disabled, loading, empty,
error, and success states. Temporary captures are allowed for agent judgment but are never committed.
State exactly what was inspected. The detailed protocol is
[references/visual-review.md](references/visual-review.md).

Each user-visible package change carries a changeset. Its body starts with exactly one section marker:
`🧩` new components, `🔧` changed components, `🗑` removed/renamed, `🛠` CLI/tooling, `📦` npm,
`📚` docs, `🐛` fixed, or `⚠️` breaking. Do not edit `/CHANGELOG.md`; release assembly owns it.
Formatting details live in [references/changelog-format.md](references/changelog-format.md).

Before pushing, preview the release batch:

```bash
node tooling/changelog-assemble.mjs --dry-run
node tooling/changelog-assemble.mjs --check
node tooling/changelog-lint.mjs
```

## 2. PR proof and merge

Commit and push the branch, open a PR, and wait for the required **PR quality** check. That one Linux
job executes full repository static verification once, then Chromium tests for changed registry
items, their transitive reverse dependents, owned cross-cutting suites, and their geometry fixtures.
The complete component suite is not part of ordinary CI.

Read the affected plan in the log. A missing owner, unclassified path, empty geometry selection,
generated drift, or unexpected affected closure is a failed gate, not a waiver candidate.

When the check passes, re-read the PR head SHA and squash-merge with that exact SHA. The `main`
ruleset requires PR quality, invalidates stale checks, enforces linear history, and blocks force
pushes. `pnpm ruleset:check` verifies the external rule before shipping.

## 3. Release, publish, and deploy

After merge, obtain the new `main` SHA and dispatch the release workflow with it:

```bash
gh workflow run release.yml \
  --repo VegaStack/vegastack-design \
  --ref main \
  -f expected_sha=<merged-main-sha>
```

The workflow fails if `main` moved. It then:

1. Assembles and versions every pending changeset as one batch.
2. Pushes one generated release commit directly to `main` through the narrow GitHub Actions ruleset
   bypass.
3. Builds and verifies only the two public npm packages.
4. Publishes versions missing from npm with OIDC and `--no-provenance`.
5. Dispatches `deploy.yml` for the exact release commit.

Deployment runs public distribution proof, not component regression: registry build/idempotency,
real `shadcn add` consume, public docs export/metadata/links/emitted CSS, focused docs-shell browser
contracts, Sigstore signing, Cloudflare upload, and the canonical production boundary probe.

Poll both workflows until terminal. Do not use a successful dispatch as evidence of completion.

## 4. Verify the outcome

Read back the npm versions and production state:

```bash
npm view @vegastack/design version
npm view @vegastack/design-tokens version
cd ../vegastack-design-starter && pnpm check-updates
```

Report the merged change SHA, generated release SHA, package versions, deployed registry version,
production-boundary result, and whether the reference consumer sees the expected changed items.

## 5. Bounded recovery

Transient network, runner, npm, registry, and deployment operations may retry their failed stage up
to three times. These retries do not consume a corrective iteration.

For a real code or configuration defect:

1. Diagnose and reproduce the root cause.
2. Create a surgical correction branch from current `main`.
3. Add the appropriate changeset.
4. Run affected PR CI, exact-SHA merge, and dispatch another release.
5. Count that source-changing release as one of at most three corrective iterations.

If some npm packages are already live, never overwrite or unpublish them. Resume unpublished packages
at their existing version when the bytes are unchanged; otherwise issue a new patch release. Prefer a
corrective release to rollback.

After three unsuccessful corrective iterations, stop and report exact live npm versions, deployed
commit, failing stage, every attempted correction, and the recommended recovery.

## 6. Manual full audit

The complete suite is a rare audit or diagnostic, never part of ordinary shipping:

```bash
gh workflow run full-suite.yml \
  --repo VegaStack/vegastack-design \
  --ref main \
  -f commit_sha=<sha> \
  -f engines=chromium       # or all
```

`all` runs Chromium, WebKit, and Firefox sequentially on Linux with WebKit required. Its result does
not replace the PR quality check and is not required for a release.

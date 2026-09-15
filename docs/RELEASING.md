# Releasing VegaStack Design

`skills/internal/ship/SKILL.md` is the operator procedure. This file defines the current release
topology. Scripts and workflows win if prose disagrees.

The GitHub repository is public. The npm packages are public; the component registry remains private
behind Cloudflare Access at `design.vegastack.com/r/*`.

## One authorization

One explicit **ship it** authorizes the current reviewed change through commit, push, PR, exact-SHA
squash merge, versioning, npm publication, public registry/docs deployment, and production
verification. No Version Packages PR or second deployment approval is used.

The authorization includes at most three surgical corrective patch iterations. It does not permit
changes to secrets, Cloudflare Access, authentication policy, workflow permissions, runner trust,
sanctioned dependencies, destructive data, or version reversal.

## Verification placement

Verification is paid once at the boundary that owns it:

| Boundary     | Proof                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| Local        | Optional `pnpm check:affected`; no receipt or required hook                           |
| Pull request | Full static proof once, then affected Chromium component/cross-cutting/geometry tests |
| Manual audit | `pnpm test:full --engines chromium\|all`                                              |
| npm publish  | Public-package build, exports, lifecycle guard, OIDC publication                      |
| deploy       | Public registry/docs distribution proof, signature, upload, production probe          |

PR selection comes from `packages/ui/component-contracts.json`: source, test, preview and registry
dependencies plus explicit cross-cutting-suite ownership. `tooling/affected-tests.mjs` walks
transitive reverse dependencies and fails unknown paths. Broad inputs run dedicated contract suites
and fixed geometry canaries; no automatic workflow expands to the complete component suite.

`pnpm verify:distribution` verifies only the public artifact: registry build/idempotency, real
`shadcn add` consume, public docs export/metadata/links/emitted CSS, and focused docs-shell browser
contracts. It does not run component regression tests.

## Protected main

The `VegaStack main` GitHub ruleset requires:

- A pull request and the `PR quality` status for the latest head.
- Linear history.
- No force pushes or deletion.
- Zero mandatory human approvals.
- A narrow GitHub Actions app bypass for the generated direct release commit.

Check it with `pnpm ruleset:check`. Apply the reviewed configuration only after the affected CI
workflow exists on `main`, using `pnpm ruleset:apply`.

## Release sequence

1. A change PR carries the canonical source, generated registry surfaces where applicable, tests,
   docs, and a changeset. CI runs the one authoritative affected proof.
2. The shipping agent squash-merges the exact green head SHA.
3. It dispatches `release.yml` with the resulting `main` SHA as `expected_sha`.
4. The workflow rejects a stale SHA, assembles every pending changeset, versions packages, refreshes
   generated release metadata, and pushes one direct release commit to `main`.
5. The publish job checks out that exact commit, builds the two public packages, verifies exports and
   lifecycle safety, then publishes missing versions through npm OIDC.
6. Release dispatches `deploy.yml` for the release commit.
7. Deploy proves the public distribution on Linux, rebuilds/signs/deploys on the credential-bearing
   macOS runner, then probes production from outside the trusted network.

The GitHub Actions release-commit push deliberately does not start another push workflow; the same
authorized workflow continues. No automatic main quality gate is needed because the ruleset prevents
unverified source from reaching `main`.

The version job has only `contents: write`. `@changesets/changelog-github` requires its
`GITHUB_TOKEN` to read PR/author metadata while generating package changelogs, and the same job must
push because Actions artifact storage is unavailable. Exact-SHA main binding, the required ruleset,
the generated-output allowlist, non-persisted checkout credentials and the isolated final push step
bound that authority; no pull-request or OIDC permission is present.

## Changesets and changelog

Every consumer-visible change has a changeset whose body opens with exactly one section marker:
`🧩 🔧 🗑 🛠 📦 📚 🐛 ⚠️`. A PR never edits `/CHANGELOG.md`.

At release time:

```text
.changeset/*.md → changelog-assemble → changeset version → version-sync → sync-changelog
```

All pending changesets ship together. The direct release commit contains package versions, package
changelogs, the assembled root changelog, synchronized docs, registry versions, and regenerated
registry output.

`meta.version` is the private `@vegastack/ui` version, while consumer update status is determined by
the item integrity hash. A global version bump therefore does not mark unchanged components stale.

## npm publishing

Only `@vegastack/design-tokens` and `@vegastack/design` publish. The private UI registry workspace is
never published.

Publishing uses npm trusted publishing with the `release.yml` identity and no `NPM_TOKEN`. The
self-hosted runner calls `npm publish --access public --no-provenance`; npm provenance bundles require
a GitHub-hosted runner, which this repository does not use. Packages publish in dependency order:
tokens first, then design.

Publication is idempotent. Before each attempt the workflow asks npm whether the exact version exists.
A missing version receives at most three publish attempts; a version that became visible after an
ambiguous response is treated as published. npm versions are never overwritten or unpublished.

## Public registry and docs deployment

Production is public-only. Automatic deploy does not build the unused private visibility matrix.

The Linux distribution job runs in the pinned Playwright container and holds no deployment
credential. Because Actions artifact storage is unavailable, the macOS credential job rebuilds the
same commit, then:

1. Requires registry generation to leave the checkout unchanged.
2. Builds the public docs and registry.
3. Signs the integrity manifest using Sigstore/GitHub OIDC.
4. Rejects a tampered manifest and wrong signer identity.
5. Re-verifies immediately before pinned Wrangler deploys.

The production probe requires all non-registry routes to be public, `/internal/*` to remain outside
discovery with `noindex`/`no-store`, anonymous `/r/*` access to fail, service-token access to work,
and the index/manifest/signature/representative item to agree cryptographically.

## Runners and permissions

Every job is self-hosted and bounded by a timeout. Linux browser jobs use
`[self-hosted, linux, vsk-runner]` plus the Playwright image pinned to the lockfile. Credential and
publication jobs use the two runner agents on the one mac mini. No job uses GitHub-hosted capacity.

OIDC exists only in `release.yml:publish` and `deploy.yml:build-sign-deploy`. Workflow permissions,
runner classes, container placement, immutable action pins, frozen installs, non-persisted checkout
credentials, exact-SHA guards, and the ban on automatic full-suite execution are enforced by
`verify-workflow-security` and its mutation harness.

## Recovery

Transient operations retry their failed stage at most three times. A real defect receives a surgical
fix PR and new patch release, up to three source-changing iterations under the original ship
authorization. Partial publication resumes only missing versions when bytes are unchanged.

Stop rather than auto-fix when recovery crosses a protected trust boundary. After three corrective
iterations, report exact npm versions, deployed commit, failing stage, attempts, and proposed manual
recovery.

## Tags and GitHub releases

A release creates neither. Historical package tags are residue of the retired release path. npm
versions and the registry's signed integrity manifest are the immutable release markers.

## Consumer update

```bash
npx vegastack-design check-updates
npx shadcn@latest add @vegastack/<name> --diff
npx shadcn@latest add @vegastack/<name> --overwrite
```

Consumers pull updates; nothing pushes component copies into their repositories.

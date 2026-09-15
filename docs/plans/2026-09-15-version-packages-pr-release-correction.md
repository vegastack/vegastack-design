# Version Packages PR release correction

**Date:** 2026-09-15 · **Status:** approved by MK · **Owner:** MK

## Why the direct-commit design is retired

GitHub rejected the proposed global GitHub Actions integration as a repository-ruleset bypass
actor: an integration must be an installed app in the ruleset's repository or owner organization.
The built-in `GITHUB_TOKEN` therefore cannot make the direct generated commit while `main` requires
pull requests. Adding an app credential, widening a human bypass, or weakening protection would add
a trust boundary solely to avoid reviewing generated release output.

MK selected the conventional alternative: restore a generated **Version Packages** PR. It receives
the same `PR quality` check as every other change and needs no `main` bypass.

## Corrected topology

1. A normal push to `main` runs the release coordinator without repeating static or component
   verification.
2. When pending changesets exist, Changesets creates or updates `changeset-release/main`. GitHub
   records its bot-created `pull_request` workflow as `action_required`; the shipping agent approves
   that native run under the existing `ship it` authorization so the required status belongs to the
   PR rather than to a duplicate dispatch.
3. The Version PR's check runs full static verification once and the positive generated-output
   scope check. It does not run component browsers or require a new changeset: the version command
   changes only versions, changelogs and generated provenance, while runtime behavior was already
   exercised on the originating change PRs.
4. The shipping agent merges the Version PR only after the exact head is green. That merge is the
   publication boundary covered by the original `ship it` authorization.
5. The resulting `main` push has no pending changesets. The coordinator publishes only missing npm
   versions through OIDC, then dispatches the public distribution deploy for that exact commit.
6. The `main` ruleset requires PRs, `PR quality`, linear history, and blocks deletion/force-pushes.
   It has no bypass actor.

## Verification contract

- The workflow-security gate and its negative harness own trigger placement, job permissions, the
  native PR-only check, Version-PR output validation, bounded publish/deploy retries, and the absence
  of any bypass or duplicate check dispatch.
- Release detection remains one tested authority and supports interrupted publication by checking
  npm when `main` already carries version bumps.
- The correction adds no package runtime dependency, secret, long-lived token, or manual publish
  path. A release still creates no git tag or GitHub release.

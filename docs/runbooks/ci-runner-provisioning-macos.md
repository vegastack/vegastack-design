# Runbook — the mac mini CI runners

**Purpose.** What the self-hosted macOS runners must have installed, and — more importantly — what
they must NOT. They run one job: `verify-macos` in `ci.yml`, plus the credential-only jobs in
`release.yml` and `deploy.yml`.

**They are not the primary CI.** The browser lanes run on the LAN Linux boxes in the pinned
Playwright container — see `ci-runner-provisioning-linux.md`. The minis exist for the
cross-platform static signal (does this tree typecheck, lint, and satisfy the design invariants on
macOS/ARM64 as well as on Linux/x86_64) and for the jobs that need a credential rather than a
browser: npm OIDC publish, Sigstore signing, the Cloudflare deploy, and the production boundary
probe.

## What must be installed

| Thing             | How                                                                                | Why                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Node              | Any Node ≥24.14 — enough to run `corepack`/`pnpm`                                  | pnpm downloads the PINNED runtime (`devEngines.runtime`, node 24.20.0) and runs every script with it |
| corepack          | Ships with Node — `corepack enable` once, as the runner user                       | pnpm comes from `packageManager` in `package.json`, never a global install                           |
| git               | Xcode command line tools                                                           | `actions/checkout` and every gate that reads history                                                 |
| The Actions agent | GitHub's standard self-hosted installer, labels `self-hosted,vsk-runners-mac-mini` | —                                                                                                    |

That is the whole list.

## What must NOT be there

- **No browsers, and no `playwright install`.** The minis cannot launch one: their Actions runner has
  no per-user Mach bootstrap namespace, so every Chromium launch dies with `bootstrap_look_up
org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP
  (reconfirmed in run `30150905149`: `launchd manager: System`, `gui domain: MISSING`). Nothing in
  the current topology asks them to, so this is a fact to respect rather than a bug to fix. If you
  ever want a second machine re-running the browser lanes, the fix is on the host — reinstall the
  runner as a **LaunchAgent in a logged-in session** — not in any workflow file.
- **No `actions/setup-node` cache step in any mini job.** Measured 2026-09-08: restoring the pnpm
  cache took **7–7.7 minutes of a ~13-minute job**. Node is preinstalled per the table above, so
  `setup-node` buys nothing and the cache costs more than the install it replaces. `verify-macos`
  uses `pnpm/action-setup` and a plain `pnpm install --frozen-lockfile`.
- **No job containers.** Containers are Linux-only and cannot start on macOS at all.
  `tooling/verify-workflow-security.mjs` bans a `container:` on every job outside its `LINUX_JOBS`
  allowlist, and the negative harness proves the ban rejects one.
- **Not enrolled in Cloudflare WARP / Access device posture.** `deploy.yml`'s
  `verify-public-boundary` proves that an anonymous request to `/r/*` is rejected, and the proof
  needs an origin outside the trusted network. From an enrolled device that request is
  authenticated and `/r/*` returns 200 — which `expectProtected()` in
  `apps/docs/scripts/probe-deployment.mjs` fails on, loudly. So enrolment does not produce a false
  pass; it produces a runner that blocks every deploy for a reason that is not a defect.
- **Not a shared developer workstation, and not holding production credentials** beyond what the
  workflows inject. A self-hosted runner executes repository code; treat the box as
  compromised-if-the-repo-is.

## Fork pull requests

This repository is public. `ci.yml` fires on `pull_request`, so both its jobs — the Linux one and
`verify-macos` — carry

```yaml
if: github.event.pull_request.head.repo.full_name == github.repository
```

`verify-workflow-security.mjs` requires that condition, **exactly**, on every job of a workflow with
a `pull_request` trigger, and the negative harness proves that `|| true`, `!(…) || true`, and
deleting it are all rejected. Until 2026-09-08 the mini jobs carried no guard at all: a fork PR ran
on the hardware on every push.

Set **Settings → Actions → "Require approval for all outside collaborators"** as well. That is a
repository setting; nothing in this tree can assert it.

## Health check

**The minis are ORG-level runners, so the repository endpoint cannot see them.** This runbook used to
print `gh api repos/VegaStack/vegastack-design/actions/runners`, which lists only the two repo-level
Linux boxes (`vsk-node-05`, `vsk-node-07`) — an operator following it saw no minis and had no way to
tell "not registered" from "not visible at this scope". Verified 2026-09-09.

Ask a recent run which machine actually took the job. This needs only the `repo` scope every operator
already has:

```bash
RUN=$(gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh api "repos/VegaStack/vegastack-design/actions/runs/$RUN/jobs" \
  --jq '.jobs[] | {name, runner_name, conclusion}'
```

`verify-macos` must report a `runner_name` of `vsk-runner-mac-mini-1` or `-2`, and `verify` a
`runner_name` of `vsk-node-05` or `-07`. A mini that has gone offline shows up as a **queued job that
never starts** — a job queued against a label no runner carries waits forever rather than failing, so
an offline runner looks like a hung pull request, not a red one. `gh run list` showing a CI run stuck
`in_progress` with no `verify-macos` job started is that symptom.

The direct runner listing needs the `admin:org` scope, which the default `gh auth login` does not
grant (`gh api orgs/VegaStack/actions/runners` returns **403 "You must be an org admin or have the
runners and runner groups fine-grained permission"**). If you have it:

```bash
gh auth refresh -h github.com -s admin:org   # once
gh api orgs/VegaStack/actions/runners --jq '.runners[] | {name, status, labels: [.labels[].name]}'
```

Every mini should then read `online` with `vsk-runners-mac-mini` among its labels. Otherwise the
GitHub UI at **Organization → Settings → Actions → Runners** shows the same thing with no scope
change.

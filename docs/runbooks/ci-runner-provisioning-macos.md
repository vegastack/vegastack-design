# Runbook — the mac mini CI runner

**There is ONE mac mini.** `vsk-runner-mac-mini-1` and `vsk-runner-mac-mini-2` are two runner
AGENTS on a single machine: both report `Machine name: 'patrick-mac-mini'` in their job banner, both
run as the user `vegastack-runners`, and they differ only in their runner root
(`~/actions-runner/runner-1/_work` and `…/runner-2/_work`). Everything else in `$HOME` is shared.
Verified 2026-09-09 from run 34335229569, and re-confirmed by MK on 2026-09-10.

Read every plural in this tree that way. The capacity of the macOS class is **two concurrent jobs on
one host**, not two hosts: there is no second machine to fail over to, the two agents contend for the
same CPU, disk and `$HOME`, and that shared `$HOME` is the fact every path below exists to respect.

**Purpose.** What that machine must have installed, and — more importantly — what it must NOT. It
runs one job: `verify-macos` in `ci.yml`, plus the credential-only jobs in `release.yml` and
`deploy.yml`.

**It is not the primary CI.** The browser lanes run on the LAN Linux boxes in the pinned Playwright
container — see `ci-runner-provisioning-linux.md`. The mini exists for the cross-platform static
signal (does this tree typecheck, lint, and satisfy the design invariants on macOS/ARM64 as well as
on Linux/x86_64) and for the jobs that need a credential rather than a browser: npm OIDC publish,
Sigstore signing, the Cloudflare deploy, and the production boundary probe.

## What must be installed

| Thing             | How                                                                                | Why                                                                                                  |
| ----------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Node              | Any Node ≥24.14 — enough to run `corepack`/`pnpm`                                  | pnpm downloads the PINNED runtime (`devEngines.runtime`, node 24.20.0) and runs every script with it |
| corepack          | Ships with Node — `corepack enable` once, as the runner user                       | pnpm comes from `packageManager` in `package.json`, never a global install                           |
| git               | Xcode command line tools                                                           | `actions/checkout` and every gate that reads history                                                 |
| The Actions agent | GitHub's standard self-hosted installer, labels `self-hosted,vsk-runners-mac-mini` | —                                                                                                    |

That is the whole list.

## What must NOT be there

- **No browsers, and no `playwright install`.** The mini cannot launch one: its Actions runner has
  no per-user Mach bootstrap namespace, so every Chromium launch dies with `bootstrap_look_up
org.chromium.Chromium.MachPortRendezvousServer.1: Unknown service name (1102)` and SIGTRAP
  (reconfirmed in run `30150905149`: `launchd manager: System`, `gui domain: MISSING`). Nothing in
  the current topology asks it to, so this is a fact to respect rather than a bug to fix. If you
  ever want the mini re-running the browser lanes, the fix is on that host — reinstall the agents as
  **LaunchAgents in a logged-in session** — not in any workflow file.
- **No `actions/setup-node` cache step in any mac-mini job.** Measured 2026-09-08: restoring the pnpm
  cache took **7–7.7 minutes of a ~13-minute job**. Node is preinstalled per the table above, so
  `setup-node` buys nothing and the cache costs more than the install it replaces. Three jobs
  (`version-pr`, `publish`, `build-sign-deploy`) carried `cache: pnpm` anyway until 2026-09-09; it is
  gone, and `verify-workflow-security.mjs` now rejects a `cache:` input on any `setup-node` step in a
  mac-mini job. See **The pnpm store** below for the second reason: the path it cached was a
  directory the next job deleted.
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
  compromised-if-the-repo-is — and it is one box, so there is no second machine still trustworthy if
  it is.

## The pnpm store

**The two agents share one `$HOME`, so every pnpm path a job uses must be scoped to the agent.**
Two are:

| What                            | Where                                          | Lifetime                 |
| ------------------------------- | ---------------------------------------------- | ------------------------ |
| `pnpm/action-setup`'s bootstrap | `${{ runner.temp }}/setup-pnpm` (`dest:`)      | per agent, wiped per job |
| The package store               | `$RUNNER_WORKSPACE/pnpm-store` (`--store-dir`) | per agent, persists      |

Both are asserted by `tooling/verify-workflow-security.mjs` on every mac-mini job, and the negative
harness proves that restoring either default is rejected.

**What went wrong before 2026-09-09 (issue #94).** `pnpm/action-setup` defaults `dest` to
`~/setup-pnpm`, opens with `rm(dest, {recursive: true})`, and then exports `PNPM_HOME` pointing
_inside_ that directory — and pnpm derives its default store from `PNPM_HOME`
(`pnpm store path` → `$PNPM_HOME/store/v11`). So both agents bootstrapped into one directory, that
directory was also the package store, and every job began by deleting it. Two consequences:

- **A red run with nothing to do with the diff.** A concurrent job installing while the other wiped
  produced `Error: ENOTEMPTY: directory not empty, rmdir
'/Users/vegastack-runners/setup-pnpm/node_modules/.bin/store/v11/files/NN'` in the _setup_ step, or a
  half-linked `node_modules` that turbo reported as `unable to spawn child process: No such file or
directory (os error 2)`. Every later step then read `skipped`. It hit three of eight pushes on
  2026-09-09.
- **No cache at all.** Every macOS install logged `reused 0, downloaded 1136` — the store never
  survived a job, so the "persistent store" on the mini was a fiction, and each run re-downloaded
  the whole graph (~20–31s of install).

**How to tell this defect from a real failure.** It fails _before_ repository code runs — in
`Running self-installer...` or in the first turbo task — and the error names a path under the runner
user's home rather than anything in the workspace. A real failure names a file in the checkout. If
you ever see one again, the check is `ls ~/setup-pnpm` on the box: after this change nothing should
create it.

**Nothing to provision.** Both paths are created by the jobs themselves. `$RUNNER_WORKSPACE` is
`~/actions-runner/runner-N/_work/vegastack-design` — a sibling of the checkout, untouched by
`git clean -ffdx`. Safe to delete at any time
(`rm -rf ~/actions-runner/runner-*/_work/vegastack-design/pnpm-store`); the next run repopulates it,
paying one cold install.

## Fork pull requests

This repository is public. `ci.yml` fires on `pull_request`, so both its jobs — the Linux one and
`verify-macos` — carry

```yaml
if: github.event.pull_request.head.repo.full_name == github.repository
```

`verify-workflow-security.mjs` requires that condition, **exactly**, on every job of a workflow with
a `pull_request` trigger, and the negative harness proves that `|| true`, `!(…) || true`, and
deleting it are all rejected. Until 2026-09-08 the mac-mini jobs carried no guard at all: a fork PR
ran on the hardware on every push.

Set **Settings → Actions → "Require approval for all outside collaborators"** as well. That is a
repository setting; nothing in this tree can assert it.

## Health check

**Both mac-mini agents are ORG-level runners, so the repository endpoint cannot see them.** This
runbook used to print `gh api repos/VegaStack/vegastack-design/actions/runners`, which lists only the
repo-level Linux boxes — an operator following it saw no mac-mini agents and had no way to tell
"not registered" from "not visible at this scope". Verified 2026-09-09.

Ask a recent run which machine actually took the job. This needs only the `repo` scope every operator
already has:

```bash
RUN=$(gh run list --workflow=ci.yml --limit 1 --json databaseId --jq '.[0].databaseId')
gh api "repos/VegaStack/vegastack-design/actions/runs/$RUN/jobs" \
  --jq '.jobs[] | {name, runner_name, conclusion}'
```

`verify-macos` must report a `runner_name` of `vsk-runner-mac-mini-1` or `-2`, and `verify` a
`runner_name` belonging to the Linux class — whichever boxes
`gh api repos/VegaStack/vegastack-design/actions/runners` lists as online
(`docs/runbooks/ci-runner-provisioning-linux.md` § Which boxes are enrolled). An agent that has gone
offline shows up as a **queued job
that never starts** — a job queued against a label no runner carries waits forever rather than
failing, so an offline runner looks like a hung pull request, not a red one. `gh run list` showing a
CI run stuck `in_progress` with no `verify-macos` job started is that symptom. Because both agents
are on one machine, that machine being down takes the whole macOS class with it.

The direct runner listing needs the `admin:org` scope, which the default `gh auth login` does not
grant (`gh api orgs/VegaStack/actions/runners` returns **403 "You must be an org admin or have the
runners and runner groups fine-grained permission"**). If you have it:

```bash
gh auth refresh -h github.com -s admin:org   # once
gh api orgs/VegaStack/actions/runners --jq '.runners[] | {name, status, labels: [.labels[].name]}'
```

Both agents should then read `online` with `vsk-runners-mac-mini` among their labels. Otherwise the
GitHub UI at **Organization → Settings → Actions → Runners** shows the same thing with no scope
change.

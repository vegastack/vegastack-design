# Runbook — enrolling a Linux CI runner

**Purpose.** Turn a Debian/Ubuntu x86_64 box on the LAN into an ordinary GitHub Actions self-hosted
runner for `VegaStack/vegastack-design`, able to run browser lanes inside the pinned Playwright
container. Budget ~10 minutes, most of it `apt` and the container pull.

**Why a second runner class.** The mac minis cannot launch a browser — their Actions runner has no
per-user Mach bootstrap namespace, so every Chromium launch dies with `bootstrap_look_up …
Unknown service name (1102)` (AGENTS.md § Locked decisions). A Linux box can start a container, and
the pinned `mcr.microsoft.com/playwright` image already contains the browsers. That is the only
reason these boxes exist; they are not general-purpose capacity.

The script and the runbook are the whole contract: **one committed script, re-runnable, no
hand-typed steps on the box.**

- Script: `tooling/runner/provision-linux-runner.sh`
- Labels applied: `self-hosted`, `linux`, `vsk-runner` (GitHub also adds `Linux`, `X64` itself;
  label matching is case-insensitive, so `runs-on: [self-hosted, linux, vsk-runner]` matches)
- Runner name: the box's short hostname
- Runner version pinned in the script, tarball verified against GitHub's published SHA-256

## Currently enrolled

| host          | address         | admin user | notes                                                                                                                                              |
| ------------- | --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vsk-node-05` | `192.168.88.75` | `admin-05` | primary; `ssh gates`                                                                                                                               |
| `vsk-node-07` | LAN             | `admin-07` | secondary; `ssh gates2`. Also a k8s control-plane node — keep concurrency low and do not add heavy lanes here without checking cluster load first. |

## Prerequisites

On the **box**:

- Debian 13 / Ubuntu, x86_64, ≥8 GB RAM, ≥4 threads.
- An admin user with **passwordless sudo** and SSH access. Do not run the script as root — the
  runner service is installed for a non-root account.
- Outbound HTTPS to `github.com`, `*.actions.githubusercontent.com`, `download.docker.com`,
  `mcr.microsoft.com`, and `registry.npmjs.org`.

On **your machine** (the one minting the token): `gh` authenticated with **admin** on
`VegaStack/vegastack-design`.

### What the box must NOT be

- **Not enrolled in Cloudflare WARP / Access device posture.** `deploy.yml`'s
  `verify-public-boundary` proves that an anonymous request to `/r/*` is rejected. From an enrolled
  device that request is authenticated, so `/r/*` returns **200** — and `expectProtected()` in
  `apps/docs/scripts/probe-deployment.mjs` fails fast on an anonymous 200 and asserts against it. So
  an enrolled box does **not** produce a false pass: it **fails the deploy loudly**, for a reason
  that is not a defect. That is fail-safe, and it is still why the prohibition stands — a runner that
  blocks every deploy on its own network posture is useless. Today the probe runs on the minis; the
  same rule applies to any runner that might host it.
- **Not a machine holding production credentials** beyond what the workflows inject. Self-hosted
  runners execute repository code; treat the box as compromised-if-the-repo-is.
- **Not a shared developer workstation.** The runner service runs continuously and the work
  directory is wiped per job.

### Fork pull requests must never reach these boxes

This repository is **public**, and the LAN boxes carry a pnpm store that survives every job. A
`pull_request` from a fork runs attacker-authored code, so two things keep it off the hardware:

1. **In code, and gated.** Every job on `[self-hosted, linux, vsk-runner]` carries
   `if: github.event.pull_request.head.repo.full_name == github.repository`.
   `tooling/verify-workflow-security.mjs` requires it on every job in `LINUX_JOBS`, and the negative
   harness proves its removal is rejected.
2. **In repo settings, by MK.** Set **Settings → Actions → General → Fork pull request workflows from
   outside collaborators** to **"Require approval for all outside collaborators"**. Agents cannot
   change repository settings, so this half is a manual, one-time action and is **not** asserted by
   any gate — if it is not set, item 1 is the only thing between a fork PR and the LAN.

## Enrol

**The token never appears in a command line, on either machine.** `/proc/<pid>/cmdline` is
world-readable, so anything in argv is visible in `ps` to every local user for the life of the
process — and `ssh <box> "RUNNER_TOKEN='$TOKEN' …"` puts it in the argv of `ssh` locally _and_ of the
remote shell. Pipe it instead. The script accepts the token **only** from `$RUNNER_TOKEN` or
**stdin**, and hands it to `config.sh` through `ACTIONS_RUNNER_INPUT_TOKEN` (the runner's supported
env equivalent of `--token`). There is no `--token` flag any more; passing one is refused with an
explanatory error.

**The Playwright image tag is never typed, on either machine.** `pnpm-lock.yaml` is its only
authority — `tooling/verify-workflow-security.mjs` pins the workflow's `container.image` to the
`playwright` version resolved there, and refuses a literal tag anywhere under `tooling/runner/` or
`docs/runbooks/`. Read it out of the repo you are standing in and hand it to the box:

```bash
# 0. The tag, derived. Every occurrence is read and they must agree (a pnpm lockfile names the
#    package under both `packages:` and `snapshots:`); two versions means there is no single
#    correct image, and both the script and the gate stop rather than guess.
PW=$(sed -n 's/^  playwright@\(.*\):$/\1/p' pnpm-lock.yaml | sort -u)
[ "$(printf '%s\n' "$PW" | wc -l)" -eq 1 ] || echo "lockfile resolves more than one playwright"
# equivalently: PW=$(node -p "/^  playwright@(.*):$/m.exec(require('fs').readFileSync('pnpm-lock.yaml','utf8'))[1]")

# 1. Copy the script to the box.
scp tooling/runner/provision-linux-runner.sh <box>:/tmp/provision-linux-runner.sh

# 2. Mint a registration token (valid ONE HOUR, one per box) and pipe it straight to the box.
#    --prepull-image fetches the Playwright container now (~2 GB) so the first CI run does not;
#    without a version it is REFUSED rather than pulling a guessed tag.
gh api -X POST repos/VegaStack/vegastack-design/actions/runners/registration-token --jq .token \
  | ssh <box> "PLAYWRIGHT_VERSION=$PW RUNNER_TOKEN=\$(cat) \
      bash /tmp/provision-linux-runner.sh --prepull-image"
```

`$PW` is expanded locally (it is a version string, not a secret); `\$(cat)` is escaped so the
**remote** shell reads the token from the ssh channel's stdin. Running from a clone of this repo on
the box needs neither — the script finds `pnpm-lock.yaml` next to itself and derives the tag.

The single quotes matter: `$(cat)` must be evaluated by the **remote** shell, which reads the token
from the ssh channel's stdin. If you are already on the box:
`printf %s '<token>' | bash /tmp/provision-linux-runner.sh`.

The script is **idempotent**: re-running it skips Docker if present, skips the tarball if the pinned
version is already unpacked, leaves an existing matching registration alone, and reinstalls/restarts
the systemd service. It never prints the token.

What it does, in order: install Docker CE from Docker's apt repo (suite pinned to the distro
codename from `/etc/os-release`, not `lsb_release`) → enable `docker` → add the user to the `docker`
group → create the persistent pnpm store → download and SHA-256-verify the runner tarball →
`config.sh --unattended --replace --labels self-hosted,linux,vsk-runner --name <hostname>` →
`svc.sh install $(id -un)` + `start` → print a health summary. A service that is already installed
is stopped and uninstalled first, and **a failure there aborts** — installing over a listener that
refused to stop would leave two runners sharing one directory.

## Health check

```bash
gh api repos/VegaStack/vegastack-design/actions/runners \
  --jq '.runners[]|{name,status,busy,labels:[.labels[].name]}'
```

Both boxes should read `"status":"online"` with `self-hosted`, `Linux`, `X64`, `vsk-runner`.
On the box itself:

```bash
ssh <box> 'cd ~/actions-runner && sudo ./svc.sh status'   # svc.sh MUST run from the runner root
ssh <box> "sudo docker run --rm mcr.microsoft.com/playwright:v$PW-noble node -v"   # $PW from step 0
```

## The persistent pnpm store

`/opt/vsk-runner/pnpm-store` on the host, created **0755 root:root** by the script and bind-mounted
into the job container as `/pnpm-store` via `container.volumes` in the workflow. Root-owned and not
world-writable is sufficient because the job container declares no `user:` and no `options:`, and
the `mcr.microsoft.com/playwright` image's default user is root — the process writing the store _is_
root. It was 0777 until 2026-09-09, which gave every unprivileged local account on the box write
access to a directory whose contents are linked straight into a CI job's `node_modules`. The job then runs
`pnpm install --frozen-lockfile --store-dir /pnpm-store`, so the install links from the store instead
of re-downloading the graph into a throwaway container.

`--store-dir` on the install, **not** `pnpm config set store-dir /pnpm-store --global`: the image has
no `PNPM_HOME` on `PATH`, so the global config write exits 1 with _"global bin directory is not in
PATH"_ (observed in run 34254795914). The flag is the only form that works there, and it must name
the same path the volume mounts.

If the workflow's mount path and this path ever disagree, installs silently fall back to a
container-local store and every run pays full download cost — that is the failure mode to look for
when a job's install time jumps.

Safe to delete at any time (`sudo rm -rf /opt/vsk-runner/pnpm-store/*`); the next run repopulates it.

## De-enrol

```bash
# Removal token (a registration token also works for `config.sh remove` on recent runners),
# piped over stdin for the same reason as enrolment.
gh api -X POST repos/VegaStack/vegastack-design/actions/runners/remove-token --jq .token \
  | ssh <box> 'RUNNER_TOKEN=$(cat) bash /tmp/provision-linux-runner.sh --deregister'
```

That stops and uninstalls the systemd service, removes the local registration, and then **verifies**
the end state before reporting anything: the systemd unit named in `~/actions-runner/.service` must
be gone and inactive, and no `Runner.Listener` process may survive. Any failing step — `svc.sh stop`,
`svc.sh uninstall`, `config.sh remove` — aborts non-zero with a message saying the box is **NOT**
de-enrolled. It never prints success over a failure.

Without a token it still removes the service locally and tells you to delete the runner entry in
**Settings → Actions → Runners**. The runner directory is left in place; delete `~/actions-runner` by
hand if the box is being retired.

## Troubleshooting

| symptom                                                        | cause / fix                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Must run from runner root or install is corrupt`              | `svc.sh` requires the runner root as CWD. `cd ~/actions-runner` first. The script does this for you.                     |
| `Cannot configure the runner because it is already configured` | An existing `.runner` for a different repo/name. Run `--deregister` first.                                               |
| `E: Unable to locate package libicu80…77` during provisioning  | Noise from the vendored `installdependencies.sh`, which probes libicu majors downward. Debian 13 has libicu76; harmless. |
| Runner shows `offline` seconds after install                   | The listener takes a moment to connect. Re-check after ~15s.                                                             |
| Job cannot start the container                                 | Docker not running (`sudo systemctl status docker`), or the user is not in the `docker` group. Re-run the script.        |
| Install step suddenly slow                                     | The pnpm store mount path drifted from `/opt/vsk-runner/pnpm-store`. See above.                                          |
| `ERROR: --token is not accepted`                               | Deliberate: argv is world-readable in `ps`. Pass the token via `RUNNER_TOKEN` or stdin — see **Enrol**.                  |
| `NOT de-enrolled` from `--deregister`                          | A real failure, not noise: the service, unit, or listener survived. Fix the reported step and re-run.                    |

## Where this is enforced

`tooling/verify-workflow-security.mjs` parses every workflow with the `yaml` package — structurally,
not by regex over text, because a flow-style job slipped past line-based discovery entirely — and
treats the Linux runners as a second allowlisted runner class (`LINUX_JOBS`). For those jobs it
requires:

- `runs-on: [self-hosted, linux, vsk-runner]`, and no other job may use that label;
- a `container:` — **required**, not merely permitted — whose image equals
  `mcr.microsoft.com/playwright:v<version>-noble` for the `playwright` version resolved in
  `pnpm-lock.yaml`;
- `defaults.run.shell: bash`, because the container's default shell is `sh`;
- the fork guard `if: github.event.pull_request.head.repo.full_name == github.repository`.

`tooling/verify-workflow-security-negative.mjs` proves each of those rejections by mutation, including
the flow-style job the pre-fix gate accepted. Containers remain banned outright on the mac-mini jobs.
The one thing no gate can assert is the repository setting under **Fork pull requests** above.

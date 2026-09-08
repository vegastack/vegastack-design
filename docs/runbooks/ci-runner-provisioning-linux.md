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
  device that request is authenticated, so a broken boundary would return 200 and the probe would
  pass falsely. Today that probe runs on the minis, but the same rule applies to any runner: an
  enrolled box must never host it.
- **Not a machine holding production credentials** beyond what the workflows inject. Self-hosted
  runners execute repository code; treat the box as compromised-if-the-repo-is.
- **Not a shared developer workstation.** The runner service runs continuously and the work
  directory is wiped per job.

## Enrol

```bash
# 1. On your machine — mint a registration token (valid ONE HOUR, one per box).
TOKEN=$(gh api -X POST repos/VegaStack/vegastack-design/actions/runners/registration-token --jq .token)

# 2. Copy the script to the box.
scp tooling/runner/provision-linux-runner.sh <box>:/tmp/provision-linux-runner.sh

# 3. Run it there as the admin user. --prepull-image fetches the Playwright container now
#    (~2 GB) so the first CI run does not pay for it.
ssh <box> "RUNNER_TOKEN='$TOKEN' bash /tmp/provision-linux-runner.sh --prepull-image"
```

The script is **idempotent**: re-running it skips Docker if present, skips the tarball if the pinned
version is already unpacked, leaves an existing matching registration alone, and reinstalls/restarts
the systemd service. It never prints the token.

What it does, in order: install Docker CE from Docker's apt repo (suite pinned to the distro
codename from `/etc/os-release`, not `lsb_release`) → enable `docker` → add the user to the `docker`
group → create the persistent pnpm store → download and SHA-256-verify the runner tarball →
`config.sh --unattended --replace --labels self-hosted,linux,vsk-runner --name <hostname>` →
`svc.sh install <user>` + `start` → print a health summary.

## Health check

```bash
gh api repos/VegaStack/vegastack-design/actions/runners \
  --jq '.runners[]|{name,status,busy,labels:[.labels[].name]}'
```

Both boxes should read `"status":"online"` with `self-hosted`, `Linux`, `X64`, `vsk-runner`.
On the box itself:

```bash
ssh <box> 'cd ~/actions-runner && sudo ./svc.sh status'   # svc.sh MUST run from the runner root
ssh <box> 'sudo docker run --rm mcr.microsoft.com/playwright:v1.61.0-noble node -v'
```

## The persistent pnpm store

`/opt/vsk-runner/pnpm-store` on the host, created 0777 by the script and bind-mounted into the job
container as `/pnpm-store` via `container.volumes` in the workflow. The job then runs
`pnpm config set store-dir /pnpm-store --global`, so `pnpm install --frozen-lockfile` links from the
store instead of re-downloading the graph into a throwaway container.

If the workflow's mount path and this path ever disagree, installs silently fall back to a
container-local store and every run pays full download cost — that is the failure mode to look for
when a job's install time jumps.

Safe to delete at any time (`sudo rm -rf /opt/vsk-runner/pnpm-store/*`); the next run repopulates it.

## De-enrol

```bash
# Removal token (a registration token also works for `config.sh remove` on recent runners):
TOKEN=$(gh api -X POST repos/VegaStack/vegastack-design/actions/runners/remove-token --jq .token)
ssh <box> "bash /tmp/provision-linux-runner.sh --deregister --token '$TOKEN'"
```

That stops and uninstalls the systemd service and removes the local registration. Without a token it
still removes the service locally and tells you to delete the runner entry in
**Settings → Actions → Runners**. The runner directory is left in place; delete
`~/actions-runner` by hand if the box is being retired.

## Troubleshooting

| symptom                                                        | cause / fix                                                                                                              |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `Must run from runner root or install is corrupt`              | `svc.sh` requires the runner root as CWD. `cd ~/actions-runner` first. The script does this for you.                     |
| `Cannot configure the runner because it is already configured` | An existing `.runner` for a different repo/name. Run `--deregister` first.                                               |
| `E: Unable to locate package libicu80…77` during provisioning  | Noise from the vendored `installdependencies.sh`, which probes libicu majors downward. Debian 13 has libicu76; harmless. |
| Runner shows `offline` seconds after install                   | The listener takes a moment to connect. Re-check after ~15s.                                                             |
| Job cannot start the container                                 | Docker not running (`sudo systemctl status docker`), or the user is not in the `docker` group. Re-run the script.        |
| Install step suddenly slow                                     | The pnpm store mount path drifted from `/opt/vsk-runner/pnpm-store`. See above.                                          |

## Where this is enforced

`tooling/verify-workflow-security.mjs` treats the Linux runners as a second allowlisted runner class
(`LINUX_JOBS`): only listed jobs may use `runs-on: [self-hosted, linux, vsk-runner]`, only those jobs
may declare a `container:`, and the image must equal the Playwright version resolved in
`pnpm-lock.yaml`. `tooling/verify-workflow-security-negative.mjs` proves each of those rejections by
mutation. Containers remain banned outright on the mac-mini jobs.

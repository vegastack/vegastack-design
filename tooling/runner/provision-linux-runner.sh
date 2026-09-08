#!/usr/bin/env bash
# Provision a Debian/Ubuntu x86_64 box as a GitHub Actions self-hosted runner for this repository.
#
# WHY THIS EXISTS
#   The mac minis cannot launch a browser (no per-user Mach bootstrap namespace — AGENTS.md
#   § Locked decisions), so every browser lane is attested rather than executed in CI. A Linux
#   runner CAN start the pinned Playwright container, which is the whole point of enrolling these
#   boxes: browser lanes become independently re-executed instead of trusted.
#
#   One committed, idempotent script is the enrolment contract. Re-running it must be safe: it
#   converges Docker, the runner tarball, the registration, and the systemd service, and it never
#   prints the registration token.
#
# THE TOKEN NEVER APPEARS IN A COMMAND LINE.
#   /proc/<pid>/cmdline is world-readable, so anything passed as an argv element is visible to every
#   local user in `ps` for as long as the process lives — this script's own argv, and config.sh's.
#   So there is no `--token` flag: the token is read from $RUNNER_TOKEN or from STDIN, and handed to
#   the runner through the environment input the runner itself supports
#   (`ACTIONS_RUNNER_INPUT_<ARG>`; actions/runner 2.337.0 CommandSettings.cs), never as `--token`.
#   Environment is not in `ps` output, and /proc/<pid>/environ is readable only by the owner.
#
# THE PLAYWRIGHT IMAGE TAG IS NEVER HARDCODED HERE.
#   The `playwright` version in pnpm-lock.yaml is the single authority, and
#   tooling/verify-workflow-security.mjs pins the workflow's container image to it. A second literal
#   in this script would drift on the next bump: the box would pre-pull an image the workflow no
#   longer uses, and the first CI run after the bump would pay the full pull it was meant to avoid.
#   So the tag is DERIVED — from pnpm-lock.yaml when this script runs inside a checkout, otherwise
#   from --playwright-version / $PLAYWRIGHT_VERSION, which the runbook shows you reading out of the
#   repo on your own machine. Without one, --prepull-image is refused rather than guessed.
#
# RUN IT ON THE BOX, as the admin user (not root; the script uses sudo where it must):
#   RUNNER_TOKEN=<token> bash provision-linux-runner.sh
#   printf %s "<token>" | bash provision-linux-runner.sh
#   printf %s "<removal-token>" | bash provision-linux-runner.sh --deregister
#
# From your machine, so the token is never on a command line at EITHER end, with the image tag read
# out of the repo you are standing in:
#   gh api -X POST repos/VegaStack/vegastack-design/actions/runners/registration-token --jq .token \
#     | ssh <box> "PLAYWRIGHT_VERSION=$(sed -n 's/^  playwright@\(.*\):$/\1/p' pnpm-lock.yaml | sort -u) \
#         RUNNER_TOKEN=\$(cat) bash /tmp/provision-linux-runner.sh --prepull-image"
#
# The token is minted on a machine holding repo-admin credentials. It expires in one hour. Mint one
# per box, immediately before running.
#
# Full procedure, prerequisites, and de-enrolment: docs/runbooks/ci-runner-provisioning-linux.md

set -euo pipefail

REPO_URL="https://github.com/VegaStack/vegastack-design"
RUNNER_VERSION="2.337.0"
# Published by GitHub in the actions/runner release body for this exact version. Verified before
# extraction: an unverified tarball run as a systemd service is arbitrary code execution on the LAN.
RUNNER_SHA256="70920811a4f8ad4328818682bca5c6469c1c942fab52448868071d0063816613"
RUNNER_LABELS="self-hosted,linux,vsk-runner"
RUNNER_DIR="${RUNNER_DIR:-$HOME/actions-runner}"
# Persistent pnpm store, bind-mounted into the Playwright container by .github/workflows so a
# `pnpm install --frozen-lockfile` is a link-from-store rather than a network fetch. Documented in
# the runbook; the workflow's `container.volumes` must agree with this path.
PNPM_STORE_HOST_DIR="${PNPM_STORE_HOST_DIR:-/opt/vsk-runner/pnpm-store}"

TOKEN="${RUNNER_TOKEN:-}"
MODE="install"
PREPULL_IMAGE=0
# May be empty. Resolved below from the flag, the environment, or a lockfile — never a literal.
PLAYWRIGHT_VERSION="${PLAYWRIGHT_VERSION:-}"

while [ $# -gt 0 ]; do
  case "$1" in
    --playwright-version)
      PLAYWRIGHT_VERSION="${2:-}"
      [ -n "$PLAYWRIGHT_VERSION" ] || {
        echo "ERROR: --playwright-version needs a value (e.g. 1.61.0)" >&2
        exit 2
      }
      shift 2
      ;;
    --playwright-version=*)
      PLAYWRIGHT_VERSION="${1#*=}"
      shift
      ;;
    --token | --token=*)
      # Deliberately rejected rather than silently ignored: it used to be accepted, and a stale
      # runbook line or muscle memory would otherwise leak the token into `ps` without a word.
      echo "ERROR: --token is not accepted — argv is world-readable in ps." >&2
      echo "       Pass the token as RUNNER_TOKEN in the environment, or on stdin:" >&2
      echo "         RUNNER_TOKEN=<token> bash $0" >&2
      echo "         printf %s '<token>' | bash $0" >&2
      exit 2
      ;;
    --deregister)
      MODE="deregister"
      shift
      ;;
    --prepull-image)
      PREPULL_IMAGE=1
      shift
      ;;
    -h | --help)
      # Bounded by the header's last line rather than a line number, which went stale the first time
      # the header grew.
      sed -n '2,/^# Full procedure/p' "$0"
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

# Stdin is the second accepted channel, and only when the environment did not supply one. `read -r`
# on a pipe with no trailing newline still yields the line (non-zero status), which is why the exit
# status is not checked here.
if [ -z "$TOKEN" ] && [ ! -t 0 ]; then
  IFS= read -r TOKEN || true
fi
TOKEN="$(printf '%s' "$TOKEN" | tr -d '[:space:]')"

log() { printf '\n==> %s\n' "$*"; }

# ---------------------------------------------------------------------------- Playwright image tag
# Read EVERY `playwright@<version>:` key, not the first. A pnpm lockfile names each package twice
# (once under `packages:`, once under `snapshots:`), and would name it more often if two versions
# were resolved — in which case there is no single correct image and guessing one is worse than
# stopping.
lockfile_playwright_version() {
  local lock="$1" versions count
  [ -f "$lock" ] || return 1
  versions="$(sed -n 's/^  playwright@\([^:]*\):$/\1/p' "$lock" | sort -u)"
  [ -n "$versions" ] || return 1
  count="$(printf '%s\n' "$versions" | wc -l | tr -d ' ')"
  if [ "$count" -ne 1 ]; then
    printf 'ERROR: %s resolves %s different playwright versions:\n' "$lock" "$count" >&2
    printf '%s\n' "$versions" | sed 's/^/  /' >&2
    return 1
  fi
  printf '%s' "$versions"
}

# The script is normally copied to /tmp on the box, where there is no checkout — so the lockfile is
# a bonus, not the plan. When it IS present (running from a clone) it wins nothing over an explicit
# flag: an operator naming a version means it.
if [ -z "$PLAYWRIGHT_VERSION" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
  PLAYWRIGHT_VERSION="$(lockfile_playwright_version "$SCRIPT_DIR/../../pnpm-lock.yaml" || true)"
fi
PLAYWRIGHT_IMAGE=""
[ -z "$PLAYWRIGHT_VERSION" ] ||
  PLAYWRIGHT_IMAGE="mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}-noble"
# svc.sh refuses to run unless the CWD is the runner root ("Must run from runner root or install is
# corrupt"), so never invoke it by absolute path.
svc() { (cd "$RUNNER_DIR" && sudo ./svc.sh "$@"); }
die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

[ "$(id -u)" -ne 0 ] || die "run as the admin user, not root — the runner service is installed for a non-root account"
[ "$(uname -s)" = "Linux" ] || die "this script provisions Linux boxes only"
[ "$(uname -m)" = "x86_64" ] || die "runner tarball pinned here is linux-x64"
command -v sudo >/dev/null || die "sudo is required"
sudo -n true 2>/dev/null || die "passwordless sudo is required"

RUNNER_NAME="${RUNNER_NAME:-$(hostname -s)}"

# ---------------------------------------------------------------------------- de-enrol
# FAILURE IS NOT SUCCESS. This block used to swallow every error (`svc stop || true`,
# `svc uninstall || true`) and then print "De-enrolled" regardless — so a box whose service was
# still installed and still running read as retired. Every step now propagates, and the final state
# is VERIFIED (unit gone, listener gone) before anything claims success.
if [ "$MODE" = "deregister" ]; then
  log "De-enrolling $RUNNER_NAME"
  [ -d "$RUNNER_DIR" ] || die "no runner directory at $RUNNER_DIR"

  # svc.sh writes the systemd unit name here at install time and deletes the file on uninstall, so
  # capture it BEFORE uninstalling: it is the only precise handle on this runner's unit, and a glob
  # over actions.runner.* would also match an unrelated runner on the same box.
  SERVICE_UNIT=""
  [ -f "$RUNNER_DIR/.service" ] && SERVICE_UNIT="$(tr -d '[:space:]' <"$RUNNER_DIR/.service")"

  if svc status >/dev/null 2>&1; then
    svc stop || die "svc.sh stop failed — the runner service is still running; NOT de-enrolled"
    svc uninstall || die "svc.sh uninstall failed — the systemd unit is still installed; NOT de-enrolled"
  else
    log "no installed service reported by svc.sh — continuing to the local registration"
  fi

  if [ -n "$TOKEN" ]; then
    # Same env-input channel as configure: a removal token in argv is world-readable in `ps`.
    (cd "$RUNNER_DIR" && ACTIONS_RUNNER_INPUT_TOKEN="$TOKEN" ./config.sh remove) ||
      die "config.sh remove failed — the runner is still registered with GitHub; NOT de-enrolled"
  else
    echo "no RUNNER_TOKEN given (env or stdin): the service is removed locally, but the runner entry"
    echo "must be deleted in GitHub (Settings → Actions → Runners) or with a removal token."
  fi

  # -------------------------------------------------------------------------- verify, then claim
  if [ -n "$SERVICE_UNIT" ]; then
    if systemctl list-unit-files --no-legend --no-pager "$SERVICE_UNIT" 2>/dev/null | grep -q .; then
      die "systemd still knows $SERVICE_UNIT after uninstall — NOT de-enrolled"
    fi
    if systemctl is-active --quiet "$SERVICE_UNIT" 2>/dev/null; then
      die "$SERVICE_UNIT is still active after uninstall — NOT de-enrolled"
    fi
  fi
  # Conservative on purpose: ANY surviving listener fails this. A second runner for another repo on
  # the same box would trip it, which is loud and correctable — unlike a silent false success.
  if pgrep -f 'Runner\.Listener' >/dev/null 2>&1; then
    die "a Runner.Listener process is still running — NOT de-enrolled: $(pgrep -af 'Runner\.Listener' | head -3)"
  fi

  log "De-enrolled and verified (unit removed, no listener running)."
  echo "$RUNNER_DIR left in place; remove it by hand if the box is being retired."
  exit 0
fi

[ -n "$TOKEN" ] || die "a registration token is required: pass it as RUNNER_TOKEN in the environment, or on stdin"

# ---------------------------------------------------------------------------- Docker CE
if command -v docker >/dev/null 2>&1; then
  log "Docker already installed — skipping apt setup"
else
  log "Installing Docker CE from Docker's apt repository"
  . /etc/os-release
  DISTRO_ID="$ID"          # debian | ubuntu
  DISTRO_CODENAME="${VERSION_CODENAME:-}"
  [ -n "$DISTRO_CODENAME" ] || die "cannot determine the distro codename from /etc/os-release"
  case "$DISTRO_ID" in
    debian | ubuntu) ;;
    *) die "unsupported distro: $DISTRO_ID (Debian/Ubuntu only)" ;;
  esac

  sudo apt-get update -qq
  sudo apt-get install -y -qq ca-certificates curl gnupg
  sudo install -m 0755 -d /etc/apt/keyrings
  # Idempotent: re-download the key and overwrite, so a truncated earlier run self-heals.
  curl -fsSL "https://download.docker.com/linux/$DISTRO_ID/gpg" |
    sudo gpg --batch --yes --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  # Codename is pinned from /etc/os-release rather than left to `lsb_release`, which is not
  # installed on a minimal Debian image and silently produces an empty (= broken) suite.
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$DISTRO_ID $DISTRO_CODENAME stable" |
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

sudo systemctl enable --now docker

# `id -un`, not $USER. $USER is set by LOGIN shells; an ssh command invocation
# (`ssh box 'bash script.sh'`) runs a non-login shell where it is frequently UNSET — and under
# `set -u` an unset variable is a hard exit, so the script would abort here in exactly the
# non-interactive path the runbook prescribes. `id -un` asks the kernel.
RUNNER_SERVICE_USER="$(id -un)"

if id -nG "$RUNNER_SERVICE_USER" | tr ' ' '\n' | grep -qx docker; then
  log "$RUNNER_SERVICE_USER is already in the docker group"
else
  log "Adding $RUNNER_SERVICE_USER to the docker group"
  sudo usermod -aG docker "$RUNNER_SERVICE_USER"
  echo "NOTE: group membership applies to NEW logins. The runner service picks it up when it starts"
  echo "      below, because systemd starts it fresh; an interactive shell needs a re-login."
fi

# ---------------------------------------------------------------------------- pnpm store
log "Ensuring the persistent pnpm store at $PNPM_STORE_HOST_DIR"
sudo mkdir -p "$PNPM_STORE_HOST_DIR"
# 0755 root:root, NOT 0777. The job container declares no `user:` and no `options:` in
# .github/workflows/ci.yml, and the mcr.microsoft.com/playwright image's default user is
# root — so the process writing this store IS root, and root writes through a 0755 root-owned
# directory regardless. 0777 bought nothing and gave every unprivileged local account on the box
# write access to a directory whose contents are linked straight into a CI job's node_modules.
# If a future workflow ever adds `options: --user <uid>`, this becomes owned by that uid instead;
# it does not go back to world-writable.
sudo chown root:root "$PNPM_STORE_HOST_DIR"
sudo chmod 0755 "$PNPM_STORE_HOST_DIR"

if [ "$PREPULL_IMAGE" -eq 1 ]; then
  # REFUSED, not guessed. A wrong tag pre-pulls an image the workflow will not use: the pull cost
  # this flag exists to avoid is simply paid by the first CI run, silently.
  [ -n "$PLAYWRIGHT_IMAGE" ] || die "--prepull-image needs the Playwright version, and no
       pnpm-lock.yaml was found next to this script. Pass it explicitly:
         --playwright-version <version>, or PLAYWRIGHT_VERSION=<version>
       Read it from the repo on your own machine with
         sed -n 's/^  playwright@\(.*\):\$/\1/p' pnpm-lock.yaml | sort -u"
  log "Pre-pulling $PLAYWRIGHT_IMAGE (first CI run would otherwise pay for it)"
  sudo docker pull "$PLAYWRIGHT_IMAGE"
fi

# ---------------------------------------------------------------------------- runner tarball
TARBALL="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
mkdir -p "$RUNNER_DIR"
if [ -x "$RUNNER_DIR/config.sh" ] && [ -f "$RUNNER_DIR/.runner-version" ] &&
  [ "$(cat "$RUNNER_DIR/.runner-version")" = "$RUNNER_VERSION" ]; then
  log "Runner $RUNNER_VERSION already unpacked in $RUNNER_DIR"
else
  log "Downloading actions/runner $RUNNER_VERSION"
  curl -fsSL -o "/tmp/$TARBALL" \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${TARBALL}"
  echo "${RUNNER_SHA256}  /tmp/${TARBALL}" | sha256sum -c -
  tar xzf "/tmp/$TARBALL" -C "$RUNNER_DIR"
  rm -f "/tmp/$TARBALL"
  echo "$RUNNER_VERSION" >"$RUNNER_DIR/.runner-version"
fi

# Debian 13 ships libicu76; the vendored script probes a descending list of libicu majors and prints
# "Unable to locate package libicu80..77" on the way down before finding one. Noise, not failure —
# it still exits 0, and .NET runs. Kept non-fatal for exactly that reason.
sudo "$RUNNER_DIR/bin/installdependencies.sh" >/dev/null

# ---------------------------------------------------------------------------- configure
# `config.sh` REFUSES to run over an existing local configuration ("Cannot configure the runner
# because it is already configured") — `--replace` only resolves a NAME collision on GitHub's side,
# not a configured working directory. So a re-run must detect the existing config and leave it
# alone; that is what makes this script safe to run repeatedly.
if [ -f "$RUNNER_DIR/.runner" ] &&
  grep -q "\"gitHubUrl\": \"$REPO_URL\"" "$RUNNER_DIR/.runner" &&
  grep -q "\"agentName\": \"$RUNNER_NAME\"" "$RUNNER_DIR/.runner"; then
  log "Runner $RUNNER_NAME already configured for $REPO_URL — leaving the registration alone"
  echo "(to change labels or re-register, run with --deregister first)"
elif [ -f "$RUNNER_DIR/.runner" ]; then
  die "$RUNNER_DIR is configured for a different repository or runner name; run --deregister first"
else
  log "Configuring runner $RUNNER_NAME for $REPO_URL"
  # --unattended keeps it non-interactive; --replace takes over a stale entry of the same name on
  # GitHub.
  #
  # THE TOKEN GOES THROUGH THE ENVIRONMENT, NOT ARGV. actions/runner resolves every command argument
  # from `ACTIONS_RUNNER_INPUT_<ARG>` when the flag is absent (CommandSettings.cs, 2.337.0), so
  # `ACTIONS_RUNNER_INPUT_TOKEN` is the supported equivalent of `--token`. Passing it as `--token`
  # put a live registration token in /proc/<pid>/cmdline, which every local user can read from `ps`
  # for the lifetime of the process.
  (
    cd "$RUNNER_DIR"
    ACTIONS_RUNNER_INPUT_TOKEN="$TOKEN" ./config.sh \
      --unattended \
      --replace \
      --url "$REPO_URL" \
      --name "$RUNNER_NAME" \
      --labels "$RUNNER_LABELS" \
      --work _work
  )
fi

# ---------------------------------------------------------------------------- systemd service
# FAILURE IS NOT SUCCESS HERE EITHER. This block used to read `svc stop || true` /
# `svc uninstall || true` — the same swallow that `--deregister` was fixed for, and with a worse
# ending: a stop that failed left the OLD listener running while `svc install` + `svc start`
# happily added a second one, so the box would run two runners off one directory and the script
# would report a clean provision. A service that is not installed is fine (that is the first-run
# case, and `svc status` gates for it); a service that exists and refuses to stop is not.
log "Installing and starting the systemd service"
if svc status >/dev/null 2>&1; then
  log "An existing service is installed — stopping and uninstalling it before reinstalling"
  svc stop || die "svc.sh stop failed — an existing runner service is still running. Installing over
       it would leave two listeners on one runner directory; fix the service, then re-run."
  svc uninstall || die "svc.sh uninstall failed — the old systemd unit is still installed; not
       reinstalling over it."
fi
svc install "$RUNNER_SERVICE_USER"
svc start

# ---------------------------------------------------------------------------- health summary
log "Health summary"
echo "host:           $(hostname -s)  ($(uname -m), $(nproc) threads)"
echo "runner name:    $RUNNER_NAME"
echo "runner labels:  $RUNNER_LABELS"
echo "runner version: $RUNNER_VERSION"
echo "runner dir:     $RUNNER_DIR"
echo "docker:         $(docker --version 2>/dev/null || sudo docker --version)"
echo "service user:   $RUNNER_SERVICE_USER"
echo "pnpm store:     $PNPM_STORE_HOST_DIR (0755 root:root)"
echo "playwright:     ${PLAYWRIGHT_IMAGE:-<not resolved — pass --playwright-version to pre-pull>}"
echo
svc status || true
echo
echo "Confirm from a machine with repo access:"
echo "  gh api repos/VegaStack/vegastack-design/actions/runners --jq '.runners[]|{name,status}'"

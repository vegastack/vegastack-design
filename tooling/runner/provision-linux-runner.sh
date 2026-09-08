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
# RUN IT ON THE BOX, as the admin user (not root; the script uses sudo where it must):
#   RUNNER_TOKEN=<token> bash provision-linux-runner.sh
#   bash provision-linux-runner.sh --token <token>
#   bash provision-linux-runner.sh --deregister --token <removal-token>
#
# The token is a registration token minted on a machine holding repo-admin credentials:
#   gh api -X POST repos/VegaStack/vegastack-design/actions/runners/registration-token --jq .token
# It expires in one hour. Mint one per box, immediately before running.
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
PLAYWRIGHT_IMAGE="${PLAYWRIGHT_IMAGE:-mcr.microsoft.com/playwright:v1.61.0-noble}"

TOKEN="${RUNNER_TOKEN:-}"
MODE="install"
PREPULL_IMAGE=0

while [ $# -gt 0 ]; do
  case "$1" in
    --token)
      TOKEN="${2:-}"
      shift 2
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
      sed -n '2,30p' "$0"
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

log() { printf '\n==> %s\n' "$*"; }
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
if [ "$MODE" = "deregister" ]; then
  log "De-enrolling $RUNNER_NAME"
  [ -d "$RUNNER_DIR" ] || die "no runner directory at $RUNNER_DIR"
  if svc status >/dev/null 2>&1; then
    svc stop || true
    svc uninstall || true
  fi
  if [ -n "$TOKEN" ]; then
    (cd "$RUNNER_DIR" && ./config.sh remove --token "$TOKEN")
  else
    echo "no --token/RUNNER_TOKEN given: the service is removed locally, but the runner entry"
    echo "must be deleted in GitHub (Settings → Actions → Runners) or with a removal token."
  fi
  log "De-enrolled. $RUNNER_DIR left in place; remove it by hand if the box is being retired."
  exit 0
fi

[ -n "$TOKEN" ] || die "a registration token is required (--token or RUNNER_TOKEN)"

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

if id -nG "$USER" | tr ' ' '\n' | grep -qx docker; then
  log "$USER is already in the docker group"
else
  log "Adding $USER to the docker group"
  sudo usermod -aG docker "$USER"
  echo "NOTE: group membership applies to NEW logins. The runner service picks it up when it starts"
  echo "      below, because systemd starts it fresh; an interactive shell needs a re-login."
fi

# ---------------------------------------------------------------------------- pnpm store
log "Ensuring the persistent pnpm store at $PNPM_STORE_HOST_DIR"
sudo mkdir -p "$PNPM_STORE_HOST_DIR"
# The Playwright image runs as root, so the store must be writable by it; 0777 is deliberate on a
# LAN CI box whose only job is this repository, and keeps the directory usable if the container
# user ever changes.
sudo chmod 0777 "$PNPM_STORE_HOST_DIR"

if [ "$PREPULL_IMAGE" -eq 1 ]; then
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
  # GitHub. The token is passed to config.sh only — never echoed.
  (
    cd "$RUNNER_DIR"
    ./config.sh \
      --unattended \
      --replace \
      --url "$REPO_URL" \
      --token "$TOKEN" \
      --name "$RUNNER_NAME" \
      --labels "$RUNNER_LABELS" \
      --work _work
  )
fi

# ---------------------------------------------------------------------------- systemd service
log "Installing and starting the systemd service"
if svc status >/dev/null 2>&1; then
  svc stop || true
  svc uninstall || true
fi
svc install "$USER"
svc start

# ---------------------------------------------------------------------------- health summary
log "Health summary"
echo "host:           $(hostname -s)  ($(uname -m), $(nproc) threads)"
echo "runner name:    $RUNNER_NAME"
echo "runner labels:  $RUNNER_LABELS"
echo "runner version: $RUNNER_VERSION"
echo "runner dir:     $RUNNER_DIR"
echo "docker:         $(docker --version 2>/dev/null || sudo docker --version)"
echo "pnpm store:     $PNPM_STORE_HOST_DIR"
echo
svc status || true
echo
echo "Confirm from a machine with repo access:"
echo "  gh api repos/VegaStack/vegastack-design/actions/runners --jq '.runners[]|{name,status}'"

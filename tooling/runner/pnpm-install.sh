#!/usr/bin/env bash
# `pnpm install` through the runner LAN's npm pull-through cache when it answers; npmjs otherwise.
#
# The vsk-runner hosts share a ~22 Mbit/s uplink. A cold install pulls ~1,340 tarballs and dies
# there under load (ECONNRESET / EAI_AGAIN, 30-10-2026). node-06 runs a read-only Verdaccio cache
# (no publish, no tokens) on the 1 Gb LAN, so each tarball crosses the uplink once for the fleet.
#
# Only this install step sees the cache: nothing goes to $GITHUB_ENV, so publish steps and every
# later `pnpm` call keep the default registry. Tarballs are still checked against the lockfile's
# sha512 integrity, so the cache cannot change what is installed. pnpm 11 reads `pnpm_config_*`
# (not `npm_config_*`) from the environment. If the cache is down, or the install through it fails
# (a cold cache answers 404 when its own uplink fetch fails), the same install runs against npmjs.
# Runbook: docs/RUNBOOK.md § 9.
set -euo pipefail
cache="${LAN_NPM_CACHE:-http://192.168.88.76:4873/}"
if node -e 'fetch(process.argv[1] + "-/ping", { signal: AbortSignal.timeout(2000) }).then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))' "$cache"; then
  echo "npm: installing through the LAN cache $cache"
  if pnpm_config_registry="$cache" pnpm install "$@"; then exit 0; fi
  echo "::warning title=LAN npm cache::install through $cache failed; retrying against registry.npmjs.org"
else
  echo "npm: LAN cache $cache did not answer; using registry.npmjs.org"
fi
pnpm install "$@"

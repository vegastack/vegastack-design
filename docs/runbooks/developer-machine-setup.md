# Runbook — setting up a developer machine

**Purpose.** Take a machine from "has git" to optional local affected verification. Budget ~10
minutes, most of it the browser download.

PR CI is authoritative: full static proof once plus exact-range affected Chromium tests. Local
commands derive affected scope from the working tree and are optional feedback.

## 1. Node

**You do not have to do anything.** pnpm owns the Node version: `devEngines.runtime` in
`package.json` pins **node 24.20.0** with `onFail: download`, pnpm resolves it into `pnpm-lock.yaml`
with a per-platform checksum, downloads it once, and runs every script — every gate — with it,
whatever Node is on your PATH.

```bash
node -v            # whatever your shell has; it does not matter
pnpm exec node -v  # v24.20.0 — what `pnpm verify` and CI actually run
```

If those two differ, that is correct and expected. On the development Mac they read v25.9.0 and
v24.20.0 respectively.

This replaces a claim that was never true. Until 2026-09-09 this runbook said `.node-version` was
enforced by `engine-strict`; it was not — `engine-strict` checks `package.json` `engines`, which read
`>=24.14.0`, so the Mac ran the whole suite on 25.9 and installed cleanly while CI ran 24. `engines`
is now `>=24.14.0 <26` (a guard against a major-version surprise, not a pin), and `.node-version`
survives as **advisory only**, for fnm/nvm/mise users who want their shell Node to match. Nothing in
the build reads it. Bump `.node-version`, `devEngines.runtime`, and `engines` together.

## 2. pnpm, via corepack

```bash
corepack enable
pnpm -v     # must match `packageManager` in package.json
```

`packageManager` pins the version; corepack installs that pin. Never `npm i -g pnpm` — a global pnpm
shadows the pin and the lockfile stops being authoritative.

## 3. Install

```bash
pnpm install
```

This also runs `husky`, which installs the git hooks. Two hooks, both cheap:

- **`pre-commit`** — `tooling/design-lint.mjs` over the registry plus `prettier --check` on the
  staged set. ~4 s, never a browser.
- **`commit-msg`** — the conventional-commit prefix.

There is no `pre-push` hook. A local affected run is convenience, not a gate.

## 4. Browsers

```bash
pnpm --filter @vegastack/ui exec playwright install chromium firefox webkit
```

`chromium` is enough for affected verification. Firefox and WebKit are needed only for the rare
manual `pnpm test:full --engines all` audit. Install all three only if this machine will run that
audit.

**This is deliberately NOT wired into `prepare`.** `prepare` runs on every `pnpm install`, including
in the CI container, and the container already ships the browsers — a `playwright install` there
would re-download ~1 GB per job into a filesystem that is discarded when the job ends. It would also
make a plain `pnpm install` on a laptop a multi-minute network operation for a machine that may only
ever want to typecheck. One explicit step, run once, is the correct trade; the failure mode if you
skip it is a legible "Executable doesn't exist" from Playwright naming this exact command, not a
mystery.

## 5. Verify affected work

```bash
pnpm check:affected
```

This uses incremental UI typechecking, then runs changed registry items, transitive reverse
dependents, owned cross-cutting tests and exact geometry fixtures. `pnpm verify` adds the complete
static proof when a local reproduction of PR CI is useful.

## The rest of the ladder

```bash
pnpm check:component button          # explicit item + reverse dependents
pnpm check:affected                  # working-tree affected feedback
pnpm verify                          # full static + working-tree affected Chromium
pnpm verify:distribution             # public artifact proof; no component suite
pnpm test:full --engines chromium    # rare manual full audit (`all` for 3 engines)
pnpm clean                     # dry-run report of reclaimable local scratch
node tooling/workspace-clean.mjs --weekly   # actually reclaim it
```

Deploy runs `verify:distribution`; ordinary component tests have already run once on the PR.

## Troubleshooting

| Symptom                                                       | Cause                                                                                                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Unsupported engine` at install                               | Node outside `engines` (`>=24.14.0 <26`). Rare now that pnpm downloads the pinned runtime — see §1.                                                  |
| `pnpm install` picks a different pnpm                         | A global pnpm shadows corepack. `npm rm -g pnpm`, then `corepack enable`.                                                                            |
| The browser suite HANGS instead of failing                    | You ran bare package tests without building dependencies. Use `pnpm check:affected` or `pnpm test:full`.                                             |
| `Executable doesn't exist at …/ms-playwright/…`               | §4 was skipped.                                                                                                                                      |
| `ENOENT … design-tokens/dist/theme.css` from a bare turbo run | Run `pnpm verify` (or `pnpm design:verify`) — the token dist is generated, not committed.                                                            |
| Disk filling up                                               | `node tooling/workspace-clean.mjs --weekly`. It refuses any agent worktree with uncommitted work and never touches `node_modules` or the pnpm store. |

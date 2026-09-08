# Runbook — setting up a developer machine

**Purpose.** Take a machine from "has git" to "can run `pnpm verify` green". Budget ~10 minutes, most
of it the browser download.

There is one command in this repository — `pnpm verify` — and it is the same command CI runs. If it
passes here, it passes there; if it fails here, that is the failure CI will report. Everything below
exists to make that true.

## 1. Node

The version is pinned in `.node-version` at the repository root, and `.npmrc` sets
`engine-strict=true`, so a mismatched Node fails at install rather than three steps later inside a
build tool with an unrelated-looking error.

```bash
cat .node-version              # the one version, everywhere
fnm use || nvm use || mise use # whichever manager you run; all three read .node-version
node -v                        # must match
```

If you have no version manager, install the exact version from nodejs.org. Do not run "whatever Node
you had" — the development Mac ran 25.9 against `engines: >=24.14` while CI ran 24, which is three
runtimes for one repository and exactly the class of difference that produces a failure nobody can
reproduce.

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

There is no `pre-push` hook. CI executes the same `pnpm verify` you do, so a local run before pushing
is a convenience, not a gate, and `--no-verify` stops being a policy word.

## 4. Browsers

```bash
pnpm --filter @vegastack/ui exec playwright install chromium firefox webkit
```

`chromium` alone is enough for `pnpm verify`. `firefox` and `webkit` are needed only by
`pnpm --filter @vegastack/ui test:all-browsers`, which runs inside `pnpm verify:release` — a deploy
step, not a daily one. Install all three anyway if you have the disk; it is a one-time ~1 GB.

**This is deliberately NOT wired into `prepare`.** `prepare` runs on every `pnpm install`, including
in the CI container, and the container already ships the browsers — a `playwright install` there
would re-download ~1 GB per job into a filesystem that is discarded when the job ends. It would also
make a plain `pnpm install` on a laptop a multi-minute network operation for a machine that may only
ever want to typecheck. One explicit step, run once, is the correct trade; the failure mode if you
skip it is a legible "Executable doesn't exist" from Playwright naming this exact command, not a
mystery.

## 5. Verify

```bash
pnpm verify
```

typecheck → lint → design:verify → the `@vegastack/ui` browser suite (unit, axe, and the geometry
contracts), then `tooling/workspace-clean.mjs --after-run` unconditionally, pass or fail. Target:
under two minutes on a developer machine.

## The rest of the ladder

```bash
pnpm check:component button    # ~5s   design-lint · typecheck · that one component's test
pnpm verify                    # <2min the whole thing — this is what CI runs
pnpm verify:release            # ~12min docs export · links · metadata · registry · consume · 3 engines
pnpm clean                     # dry-run report of reclaimable local scratch
node tooling/workspace-clean.mjs --weekly   # actually reclaim it
```

`verify:release` runs in `deploy.yml` before anything outward happens. You rarely need it locally.

## Troubleshooting

| Symptom                                                       | Cause                                                                                                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Unsupported engine` at install                               | Wrong Node. `engine-strict=true` is doing its job — see §1.                                                                                              |
| `pnpm install` picks a different pnpm                         | A global pnpm shadows corepack. `npm rm -g pnpm`, then `corepack enable`.                                                                                |
| The browser suite HANGS instead of failing                    | You ran `pnpm --filter @vegastack/ui test` directly. Go through `pnpm verify` — turbo's `^build` is what builds `@vegastack/design`'s gitignored `dist`. |
| `Executable doesn't exist at …/ms-playwright/…`               | §4 was skipped.                                                                                                                                          |
| `ENOENT … design-tokens/dist/theme.css` from a bare turbo run | Run `pnpm verify` (or `pnpm design:verify`) — the token dist is generated, not committed.                                                                |
| Disk filling up                                               | `node tooling/workspace-clean.mjs --weekly`. It refuses any agent worktree with uncommitted work and never touches `node_modules` or the pnpm store.     |

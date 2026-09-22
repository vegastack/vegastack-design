---
---

🛠 The Version Packages PR refreshes `pnpm-lock.yaml` after rewriting internal dependency ranges.

`version-sync` rewrites the semver range `@vegastack/design` declares on `@vegastack/design-tokens`
whenever a bump moves that package out of the pinned range, but nothing regenerated the lockfile
afterwards — and `pnpm-lock.yaml` records the range as a specifier. The generated branch therefore
carried a manifest and a lockfile that disagreed, and its own `PR quality` run died at
`pnpm install --frozen-lockfile` before reaching a single gate.

`version-packages` now runs `pnpm install --lockfile-only --ignore-scripts` between `version-sync`
and `sync-changelog`. `linkWorkspacePackages` is on, so the pair resolves locally: the refresh needs
no network and does not need the new `design-tokens` to exist on npm, which it does not at the
moment this runs.

The failure was latent from the moment the two packages' versions diverged and only fires when a
bump leaves the `^` range — which is why every previous release passed. No new gate: the check that
should have caught this is the Version PR's own required run, and it did.

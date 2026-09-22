---
---

🛠 The package-exports gate resolves its sibling from the tarball under test, not from npm.

`verify-package-exports` packs both public packages and installs them into a throwaway consumer
under npm and again under pnpm. `@vegastack/design` depends on `@vegastack/design-tokens` by semver
range, and `version-sync` rewrites that range on the Version Packages PR — so on a release that
moves `design-tokens`, the range names a version npm does not have yet, because that release is what
publishes it. npm hoisted the local tarball and passed; pnpm resolved independently, went to the
registry and failed the whole gate.

The consumer now overrides that dependency to the tarball just built — the top-level `overrides` key
for npm, `pnpm-workspace.yaml` for pnpm, which in pnpm 11 no longer reads `pnpm.overrides` from
package.json. Because an override could equally hide a range pointing at the wrong sibling, it is
paired with an assertion that the declared range equals `^<the design-tokens version being shipped
beside it>`, which is the form `version-sync` writes. The gate keeps failing on a genuinely wrong
range; it stops failing on a version that does not exist yet.

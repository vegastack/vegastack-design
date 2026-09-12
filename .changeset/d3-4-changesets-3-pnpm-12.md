---
---

🛠 **Release plumbing moves a major: Changesets 3, `changesets/action` v2, pnpm 12.**
`@changesets/cli` 2.31.1 → 3.0.2 and `@changesets/changelog-github` 0.5.2 → 1.0.1. Changesets 3
stops versioning private packages by default, and `@vegastack/ui` — the private registry workspace
whose version _is_ the design-system version — is exactly such a package, so
`.changeset/config.json` now states `privatePackages: { version: true, tag: false }` (v2's old
default) explicitly. Without it `changeset status` fails outright on the first changeset that names
both `@vegastack/ui` and a public package, and `changelog-assemble` has no heading version. The
`$schema` follows the CLI to `@changesets/config@4.0.0`; `linked`, `access` and `ignore` are
unchanged.

`changesets/action` v1.9.0 → v2.1.2 in `release.yml`, still sha-pinned. v2 refuses to run against
Changesets 2, renamed every root input to kebab-case (`version:` → `version-script:`), and pushes
through the GitHub API by default, so `commitMode: github-api` is gone rather than renamed. The
`GITHUB_TOKEN` env stays: it is read by `@changesets/changelog-github` inside
`pnpm run version-packages`, not by the action.

pnpm 11.7.0 → 12.3.4 in `packageManager`, which is what all five LAN Linux runners and both mac
minis take their pnpm from. `pnpm/action-setup` moves 6.0.9 → 6.1.0 in all three workflows,
because pnpm 12 ships a native executable that the action could not install before that release.
pnpm 12 records its own pin in `pnpm-lock.yaml` as a second YAML document; the store version is
unchanged (`v11` under both majors), so the persistent runner stores are reused rather than
refilled.

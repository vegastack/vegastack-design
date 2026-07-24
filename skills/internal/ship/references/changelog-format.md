# Root CHANGELOG.md format

Enforced by `tooling/changelog-lint.mjs` — deviations fail lint.

## Entry heading

```markdown
## [x.y.z] — July 19, 2026
```

- Version = the design-system (registry) version — `@vegastack/ui`'s version, which every
  registry item carries as `meta.version`.
- Em dash (`—`), friendly date (`Month D, YYYY`). Entries in descending version order.

## Sections (fixed vocabulary — use only these, only when non-empty, in this order)

```
### 🧩 New components
### 🔧 Changed components
### 🗑 Removed / renamed
### 🛠 CLI & tooling
### 📦 npm
### 📚 Docs
### 🐛 Fixed
### ⚠️ Breaking
```

## Bullets

One bullet per change. Shape:

```markdown
- **ComponentName** — what changed and why it matters to a consumer (one or two sentences).
  [docs](https://design.vegastack.com/docs/components/component-name) ·
  [`abc1234`](https://github.com/VegaStack/vegastack-design/commit/abc1234)
```

- Bold the component/item name(s). Multiple components in one change: bold each, one bullet.
- Every bullet about a component links its docs page; every bullet links at least one commit
  (short sha, must exist — lint checks `git cat-file`).
- `📦 npm` bullets name the package and the NEW version in bold; note packages that
  deliberately did not move.
- Site links use the full `https://design.vegastack.com/docs/...` form here; the sync script
  rewrites them to root-relative for the docs page.

## Sync contract

The docs page (`apps/docs/content/docs/changelog.mdx`) is generated between its
`CHANGELOG:START/END` markers by `node tooling/sync-changelog.mjs`. Never edit that region;
`--check` (wired into docs lint) fails the build on drift.

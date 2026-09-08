# Root CHANGELOG.md format

Enforced by `tooling/changelog-lint.mjs` — deviations fail lint.

**The file is assembled, not hand-written.** `tooling/changelog-assemble.mjs` builds each release
entry from the pending changesets during `pnpm run version-packages`; a PR writes a changeset and
nothing else. This document is what the assembler emits, and what a changeset body must therefore
contain — read it as the shape of a changeset body plus the entry scaffolding around it.

## Entry heading

```markdown
## [x.y.z] — July 19, 2026

<!-- assembled from 17 changesets: 4f0a91c2b7de -->
```

The comment under the heading is the assembler's provenance line, and it is what makes a re-run a
no-op. A heading WITHOUT it is a hand-written entry, which `changelog-assemble` refuses rather than
merging into. `sync-changelog` strips it from the docs page (MDX has no HTML comments).

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

## Changeset bodies (the source of every bullet)

```markdown
---
"@vegastack/ui": minor
---

🔧 **Button** — what changed and why it matters to a consumer.
[docs](https://design.vegastack.com/docs/components/button)
```

- The body OPENS with exactly one section emoji from the vocabulary above; the assembler strips it
  and files the bullet under that section. Two markers, no marker, or no text is a
  `tooling/changeset-lint.mjs` failure.
- An **empty** changeset (frontmatter naming no package) carrying body text is valid and IS
  assembled — the changelog line for a change that publishes nothing.
- The assembler appends the commit sha of the changeset file (7 characters, matching every existing
  entry) when the body carries no commit link, and generates the `📦 npm` bullets from the release
  plan — each public package's own `package.json` version before the bump, not the linked group's —
  so an author writes neither.
- A body's `/docs` links and commit shas are validated at PR time by `tooling/changeset-lint.mjs`,
  using `changelog-lint`'s own rules rather than a second copy of them.
- Multi-line bodies keep their line breaks; continuation lines are indented into the bullet.

## Bullets

One bullet per change, as the assembler emits it. Shape:

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

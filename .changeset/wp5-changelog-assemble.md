---
---

🛠 **The root `CHANGELOG.md` release entry is assembled from the changesets.** A PR's only changelog
artefact is its changeset, whose body opens with one of the eight section emoji;
`tooling/changelog-assemble.mjs` groups those bodies into the `## [x.y.z]` entry at version time,
inside `pnpm run version-packages`, and `sync-changelog` regenerates the docs page as before.
`tooling/changeset-lint.mjs` rejects a body with no marker, two markers, or no text. Nobody
hand-edits `/CHANGELOG.md` between releases — it was one list at the top of one file, and every
branch collided on it.

---
---

🛠 A release whose changesets all bump nothing no longer fails the coordinator.

`release-detect.mjs` decided the Version PR path by counting files in `.changeset/`. The
empty-frontmatter changeset is the documented form for a change that bumps no published package, and
`changeset version` consumes it without writing a version — so Changesets opens no PR, while the
workflow had been told to expect one. It retried, hard-errored, and skipped the deploy; and because
the changeset stays pending, every later push to `main` failed identically.

The output is now `has_version_bump` and means what the workflow actually asks: at least one pending
changeset declares a bump for a package Changesets will version. Frontmatter is read at the same ref
as the file list, and packages in the Changesets `ignore` list are excluded, since naming one bumps
nothing and would dead-end the same way.

This removes the failure. It does not change deploy policy: a docs-only push still does not deploy
on its own — it never has — and now simply succeeds and waits for the next release.

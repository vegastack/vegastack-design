---
---

🛠 The release scope guard knows about the lockfile, and is specific about it.

`verify-release-output-scope` is an allowlist, and `pnpm-lock.yaml` was not on it — because until
this release `version-packages` never produced a lockfile change. It does now, so the guard rejected
a legitimate release output.

The lockfile gets its own class with its own predicate rather than being waved through beside the
changelogs: it is the one release output where a new third-party dependency could hide, which is the
threat the allowlist exists for. The `specifier:`/`version:` lines under a `@vegastack/*` key are
neutralised — the same move already made for the package manifests — and everything else must be
byte-identical. Verified against this release's real lockfile diff (exactly one line) and against a
synthetic third-party addition and re-resolve, both rejected.

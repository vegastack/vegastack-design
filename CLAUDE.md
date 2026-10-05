# CLAUDE.md

@AGENTS.md

All project instructions live in **AGENTS.md** (the canonical, cross-tool agent file — the line
above imports it). This file exists only so Claude Code loads it; do not add project guidance here,
edit AGENTS.md instead.

Claude-specific notes:

- **Skills are already wired.** `.claude/skills/` symlinks every skill in `skills/internal/` and
  `skills/public/`. Invoke by directory name: `/component`, `/review`, `/ship`.
  A new skill needs symlinks in **both** `.claude/skills/` and `.agents/skills/` (Codex reads the
  latter) — `tooling/skill-lint.mjs` fails closed if either is missing or stale.
- **Verification follows AGENTS.md § Verification — owned boundaries.** PRs run
  `pnpm verify:static` and deterministic affected Chromium; `pnpm verify:distribution`
  proves docs/registry consumption without repeating the component suite. There is no
  `verify:release` command. Read the named failing stage before rerunning it.
- **Creating a top-level skills directory that did not exist at session start requires a restart**
  before Claude Code watches it. Edits to an existing skill are picked up live.

Release authority follows AGENTS.md’s 3 October 2026 clarification: go-dark permits feature work, not main updates. Every main merge/push/fast-forward needs explicit operator approval. Read docs/RELEASING.md for the scope of an expressly authorized release.

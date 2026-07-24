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
- **Creating a top-level skills directory that did not exist at session start requires a restart**
  before Claude Code watches it. Edits to an existing skill are picked up live.

One rule worth repeating every session: **`/ship` (publish, Version-PR merge, deploy) is always MK's
decision — prepare, present, and wait for an explicit "yes proceed"; never auto-ship.** Each gate is
separate; approval for one is not approval for the next. (Canonical statement in AGENTS.md
§ Releasing.)

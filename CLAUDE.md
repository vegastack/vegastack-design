# CLAUDE.md

@AGENTS.md

All project instructions live in **AGENTS.md** and **docs/RUNBOOK.md**; this file only makes Claude Code
load them. Do not add guidance here.

- Skills are symlinked in `.claude/skills/` (Claude Code) and `.agents/skills/` (Codex); a new skill needs
  both links (`tooling/skill-lint.mjs` checks). Invoke by directory name: `/component`, `/review`, `/ship`.
- A new top-level skills directory needs a Claude Code restart before it is watched.

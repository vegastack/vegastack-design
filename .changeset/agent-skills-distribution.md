---
"@vegastack/design": minor
---

Ship the VegaStack agent skills to consumers and add a `skills` subcommand to install them.

`npx vegastack-design skills install` writes the four public skills — `vegastack-design-system`,
`vegastack-consume`, `vegastack-design-audit`, and `vegastack-brand` — into both `.claude/skills/`
(Claude Code) and `.agents/skills/` (Codex). The skills are bundled in this package, so installing
them needs no registry credentials and no repository access; external and client projects stay
tokenless.

The installer is safe by default: it never overwrites an existing file that differs without
`--force`, never writes through a symlink, and aborts the whole run on any conflict rather than
leaving a half-installed set. `--claude`/`--codex` select a single surface, `--dir` targets another
project root, and `--dry-run` reports the plan without writing. `vegastack-design skills list` shows
what a given version bundles.

The design-system skill's component roster is generated from the design system's own component
contract, so it cannot drift from the components that actually exist.

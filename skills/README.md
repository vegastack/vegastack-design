# Skills

Agent skills for the VegaStack design system, split by **audience**. This file is maintainer
documentation, not a skill — it is deliberately not a `SKILL.md`.

```
skills/
├── internal/    consumed WHILE developing this repo. Never published.
└── public/      OUTPUT of this repo. Mirrored into @vegastack/design and shipped to consumers.
```

## Internal — maintainers of this repo

| Skill                                      | Use when                                                                                            |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| [`component`](internal/component/SKILL.md) | Adding a new component/hook/block, or changing an existing one                                      |
| [`review`](internal/review/SKILL.md)       | Reviewing or auditing this repo — gates, rule triage, adversarial hunting, visual review discipline |
| [`ship`](internal/ship/SKILL.md)           | Preparing a release. **MK-gated at every outward step**                                             |
| [`gates`](internal/gates/SKILL.md)         | Reading a failed pre-commit/pre-push run, classifying it at its root, and what the receipt means    |

## Public — downstream consumers

| Skill                                                                | Use when                                               |
| -------------------------------------------------------------------- | ------------------------------------------------------ |
| [`vegastack-design-system`](public/vegastack-design-system/SKILL.md) | Building product UI on VegaStack                       |
| [`vegastack-consume`](public/vegastack-consume/SKILL.md)             | Setting up a project, adding components, registry auth |
| [`vegastack-design-audit`](public/vegastack-design-audit/SKILL.md)   | Auditing a consumer app for alignment and drift        |
| [`vegastack-brand`](public/vegastack-brand/SKILL.md)                 | Marketing identity — a stub until assets land          |

## How discovery works

Neither Claude Code nor Codex reads a bare `skills/` directory. Each reads its own surface, so every
skill is symlinked into both:

```
.claude/skills/<name>  →  ../../skills/{internal,public}/<name>     # Claude Code
.agents/skills/<name>  →  ../../skills/{internal,public}/<name>     # Codex
```

Both vendors document this, and both follow symlink targets — verified against primary sources, not
inferred:

| Agent       | Reads                                                                                                                                                | Symlinks                                                          |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Claude Code | `.claude/skills/<name>/SKILL.md`, plus `~/.claude/skills/` and nested `.claude/skills/` in subdirectories                                            | Follows the target; loads once even if reachable from two places  |
| Codex       | `.agents/skills/` at the repo root, the CWD, and parent dirs, plus `~/.agents/skills/` and `/etc/codex/skills` — explicitly **not** `.claude/skills` | "Supports symlinked skill folders and follows the symlink target" |

That is why one canonical skill plus two symlinks serves both, and why neither surface may be
dropped: removing `.agents/skills` makes every skill invisible to Codex, and removing
`.claude/skills` makes them invisible to Claude Code.

The invoked command name comes from the **directory name**, not the frontmatter — so `/component`,
`/review`, `/ship`, `/gates`, `/vegastack-design-system`.

Windows checkouts with `core.symlinks=false` will not get working symlinks. Consumers are unaffected:
the published path copies files rather than linking them.

## How public skills reach consumers

`skills/public/**` is mirrored byte-for-byte into `packages/design/skills/**`, which is listed in
that package's `files`, so it ships inside the public `@vegastack/design` npm package. Consumers run:

```bash
npx --package=@vegastack/design vegastack-design skills install
```

The mirror is committed, not a build artifact, so it is present at `npm pack` time regardless of
build order.

## Rules

- **Edit the canonical skill under `skills/`, never the mirror** under `packages/design/skills/`.
  Re-mirror with `node tooling/sync-package-skills.mjs`; `--check` gates drift in `pnpm lint`.
- **Public skills must not reference repo-internal paths** (`packages/`, `tooling/`, `apps/`,
  `docs/`, `.changeset/`). A consumer has none of those directories. `tooling/skill-lint.mjs`
  enforces this.
- **Public skill directories are `vegastack-`-prefixed**, so they cannot collide with a consumer's
  own skills. Internal ones are not, so they stay short to type.
- **Frontmatter follows the [Agent Skills spec](https://agentskills.io/specification)**: `name` and
  `description` are required, `license`/`compatibility`/`metadata`/`allowed-tools` are optional, and
  nothing else is valid — an agent silently ignores an unknown key, so lint has to catch it. `name`
  must equal the directory name, be ≤64 chars, and use single hyphens only. `description` is capped
  at 1024 chars, and `SKILL.md` should stay under 500 lines with detail in `references/`.
- **The description carries every trigger.** Only the description is in context until the skill
  fires, so a "when to use this skill" section in the body is dead weight — put it in the
  description.
- **A change under `skills/public/` needs a changeset** for `@vegastack/design`; it is
  consumer-visible.
- **The audit rule reference is gated against the linter** — the ids documented in
  `internal/review/references/lint-rules.md` and the ids `tooling/design-lint.mjs` actually
  reports must match exactly, in both directions.

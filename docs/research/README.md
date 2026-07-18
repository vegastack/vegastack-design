# Research store — durable learnings

This folder is the **persistent research memory** for `vegastack-design`. The detailed cataloging and adversarial research below was produced by parallel investigation agents whose context is otherwise lost — it is preserved here in full so the learnings survive and are reusable throughout the build (design decisions, skill authoring, the component port, release setup, deploy).

**Use these throughout the project.** When a build decision touches one of these areas, read the relevant doc rather than re-researching. All version/tooling claims are cited to June-2026 primary sources; re-verify before asserting as fact if time has passed.

## Index
| Doc | What it holds |
|---|---|
| [findings.md](findings.md) | **Synthesis dossier** — condensed verdicts across all streams. Start here for the big picture. |
| [catalog-resend-design-skills.md](catalog-resend-design-skills.md) | Full teardown of the `resend-design-skills` repo — the model for our skill suite. 4 skills, two-layer tokens, 13 heuristics, audit rubric. |
| [catalog-vegastack-platform.md](catalog-vegastack-platform.md) | Full inventory of the source app — ~50 Vega components, exact OKLCH token values, CVA patterns, showcase structure. **Source material for the port.** |
| [decision-primitives-and-distribution.md](decision-primitives-and-distribution.md) | Base UI vs Radix (cited verdict), shadcn "never edit" myth-check, npm/registry/hybrid tension, auth, Tailwind v4 boundary mechanics. |
| [reference-monorepo-release-deploy.md](reference-monorepo-release-deploy.md) | Monorepo layouts of 11 systems, pnpm+Turborepo+Changesets configs, GitHub Packages setup, OpenNext/Cloudflare deploy. Concrete configs/commands. |
| [reference-showcase-docs-and-agents.md](reference-showcase-docs-and-agents.md) | Storybook/Fumadocs/Ladle/Nextra comparison, what real DS sites use, per-component page section orders (8 systems) + canonical template, agent-consumable artifacts (registry/MCP/AGENTS.md/skills). |

## Provenance
Compiled 2026-06-20 during the requirements phase. Research methods: full file reads of the two reference repos + WebSearch/WebFetch/Context7 against official docs, GitHub repos, release notes, and changelogs. Adversarial posture — claims cross-checked against primary sources; conflicts of interest flagged (e.g. the Radix "liability" quote is from a Base UI principal).

## How this maps to decisions
Every locked decision in [`../requirements.md`](../requirements.md) §3 traces back to a doc here:
D1 (Base UI) → decision-primitives · D2 (hybrid) → decision-primitives + findings · D5 (DTCG tokens) → reference-monorepo-release-deploy · D9 (Fumadocs) → reference-showcase-docs-and-agents · D10 (pnpm+Turbo+Changesets) → reference-monorepo-release-deploy · D11 (deploy) → reference-monorepo-release-deploy · skills (§11) → catalog-resend + reference-showcase-docs-and-agents · component port (§12) → catalog-vegastack.

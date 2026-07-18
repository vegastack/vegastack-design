# vegastack-design — docs

Internal design system + design skills for VegaStack. One source of truth; downstream projects consume via a private shadcn registry (components) + npm packages (tokens/theme/utils); built for humans and AI agents (Claude Code, Codex).

## Index
- **[requirements.md](requirements.md)** — the requirement document. Locked decisions, architecture (two-layer hybrid), token/override model, repo structure, component inventory, skills, release strategy, phasing, open questions. **Start here.**
- **[gap-analysis.md](gap-analysis.md)** — adversarial sweep of what the requirement doc still missed (icons, motion, fonts, dark-mode runtime, the "knobs" contract, app-coupled split, Tiptap licensing, testing/a11y, +25 more). 33 gaps + a **Resolved** log, incl. the **Codex adversarial-review findings F1–F5**.
- **[plans/00-START-HERE.md](plans/00-START-HERE.md)** — **fresh-session handoff.** Operating mode (go dark, build the whole system LOCALLY, no push/publish/deploy until MK review), locked decisions, ledger + subagent + Codex-loop requirements, Node 24, VRT-deferral. The autonomous builder reads this first.
- **[plans/HANDOFF-PROMPT.md](plans/HANDOFF-PROMPT.md)** — the literal copy-paste prompt to start the autonomous build session + the strict Codex review prompt.
- **[plans/implementation-plan.md](plans/implementation-plan.md)** — the master plan: pinned **version matrix** (verified npm 2026-06-21), the pre-made **decision log** (DL1–DL13), phases P0–P5 with acceptance gates, and the **showcase-first checkpoint**. Decision-free.
- **[plans/detail/](plans/detail/)** — verbatim, copy-paste configs (the executing agent never improvises): [01 monorepo/release/CI](plans/detail/01-monorepo-release-ci.md) · [02 tokens/theming](plans/detail/02-tokens-and-theming.md) · [03 Fumadocs showcase](plans/detail/03-fumadocs-showcase.md) · [04 registry/Cloudflare](plans/detail/04-registry-and-cloudflare.md) · [05 components/forms/testing](plans/detail/05-components-and-testing.md) · [06 platform migration](plans/detail/06-platform-migration.md). All configs verified against official docs + the cloned `references/fumadocs`.
- **[research/](research/README.md)** — durable research store. [findings.md](research/findings.md) is the synthesis; the sibling docs preserve full-detail learnings (resend teardown, vegastack inventory with exact tokens, Base UI vs Radix verdict, registry/distribution mechanics + auth, monorepo/release/deploy configs, showcase tooling + component-page template + agent enablement). Cited to June-2026 primary sources. **Reused throughout the build — read the relevant doc instead of re-researching.**

## Status
Requirements drafted (2026-06-20) and pending review. Next: discuss/refine `requirements.md`, then a phased implementation plan in `/docs/plans/`. No code until the plan is approved.

## Locked decisions (quick reference)
Base UI (via shadcn, reversible) · Hybrid distribution (npm tokens + private registry components) · Greenfield then migrate platform · `@vegastack/*` scope, repo `vegastack-design` · DTCG + Style Dictionary tokens · refine-then-lock identity · 64-component system (phased) · all 4 skill suites · Fumadocs showcase (Storybook deferred) · pnpm + Turborepo + Changesets · static export on Cloudflare Workers behind Access.

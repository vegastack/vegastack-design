# CLAUDE.md

@AGENTS.md

**Claude Code:** read `docs/plans/00-START-HERE.md`, then `docs/plans/implementation-plan.md` and the `docs/plans/detail/*` files (verbatim, copy-paste configs). **Operating mode: build LOCAL, stop at publish/deploy** — the user triggers irreversible public actions. Make no architecture decisions; every choice is pre-made in `docs/requirements.md` §3 and `docs/gap-analysis.md`. If something is genuinely missing, stop and ask.

**Editing components — SINGLE SOURCE OF TRUTH:** components live in three synced places (canonical `packages/ui/registry/ui/<name>.tsx`, generated copy-in `apps/docs/components/ui/<name>.tsx`, generated `apps/docs/public/r/<name>.json`). **Edit canonical ONLY, then run `npm run registry:build`** to regenerate the copy-in + JSON + re-stamp integrity headers (idempotent, local). NEVER hand-edit the copy-in or fix component styling in `apps/docs/components/preview/*.tsx`. Full rationale + verified round-trip in AGENTS.md "Editing a component" and `docs/plans/component-polish-mandate.md`.

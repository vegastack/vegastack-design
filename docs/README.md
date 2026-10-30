# vegastack-design — docs

VegaStack's design-system procedure (`RUNBOOK.md`), decisions, and historical records.

## Start with current authority

- [`../AGENTS.md`](../AGENTS.md) — current architecture, rules, truth hierarchy, commands, and task
  router.
- [`../design.md`](../design.md) — current design doctrine, kept synchronized by a build gate.
- [`RUNBOOK.md`](RUNBOOK.md) — the one procedure: change, CI, review, release, deploy, recovery, app pull.
- [`decisions.md`](decisions.md) — locked decisions, sanctioned dependencies, build rules (rationale).
- [`../skills/README.md`](../skills/README.md) — current maintainer and consumer skill map.
- `packages/ui/upstream/decisions.json` — the decision register (why anything differs from upstream);
  its rationale is in the historical [`plans/2026-09-18-shadcn-reset/`](plans/2026-09-18-shadcn-reset/).
- [`MIGRATING-SHADCN-RESET.md`](MIGRATING-SHADCN-RESET.md) — the consumer-facing break: every
  retired component and its replacement, the deleted tokens, and the removed `@vegastack/design`
  exports. There is no compatibility layer.

For current package versions and registry inventory, query npm/the workspace and the machine
authorities named in `AGENTS.md`; do not copy a number from prose.

## Historical records

`requirements.md`, `gap-analysis.md`, `plans/`, `audits/`, and most `research/` documents are
point-in-time records. They explain why a decision was made and preserve the evidence available at
that time. They are not current operating instructions, package inventories, version authorities,
or autonomy grants. Historical handoffs and mandates carry explicit banners where their old wording
could otherwise be mistaken for live authority.

- [`requirements.md`](requirements.md) — original requirements and locked-decision rationale.
- [`gap-analysis.md`](gap-analysis.md) — original adversarial gap analysis and resolution record.
- [`plans/`](plans/) — approved plans and execution history; read banners before using any command.
- [`plans/public-docs-cutover.md`](plans/public-docs-cutover.md) — superseded one-time cutover
  record; its phased deploy commands are no longer operational.
- [`audits/`](audits/) — dated audit evidence.
- [`research/`](research/README.md) — durable source research; confirm version-sensitive claims
  against the installed dependency and its official documentation.
- [`ledger/`](ledger/) — historical implementation, bug and review records (closed; findings now live in PRs).

## Current status

The public npm packages and private registry are shipped. `design.vegastack.com` is public on every
non-registry route, including the unlisted/noindex `/internal/*` operations pages; only `/r/*`
requires a Cloudflare Access service token. Every production dispatch proves this one boundary.

# vegastack-design — docs

VegaStack's design-system records, release runbooks, research, and ledgers.

## Start with current authority

- [`../AGENTS.md`](../AGENTS.md) — current architecture, rules, truth hierarchy, commands, and task
  router.
- [`../design.md`](../design.md) — current design doctrine, kept synchronized by a build gate.
- [`RELEASING.md`](RELEASING.md) — current release and deployment reference.
- [`../skills/README.md`](../skills/README.md) — current maintainer and consumer skill map.
- [`plans/public-docs-cutover.md`](plans/public-docs-cutover.md) — current, separately approval-gated
  public-docs cutover and rollback runbook.

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
- [`audits/`](audits/) — dated audit evidence.
- [`research/`](research/README.md) — durable source research; confirm version-sensitive claims
  against the installed dependency and its official documentation.
- [`ledger/`](ledger/) — append-only implementation, bug, review, and operator-judgment history.

## Current status

The public npm packages and private registry are shipped. Production docs and registry deployment
continue through the `ship` skill. The public-docs cutover remains a separate, opt-in approval flow;
ordinary deploys do not perform it.

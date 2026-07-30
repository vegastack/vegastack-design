# vegastack-design — docs

VegaStack's design-system records, release runbooks, research, and ledgers.

## Start with current authority

- [`../AGENTS.md`](../AGENTS.md) — current architecture, rules, truth hierarchy, commands, and task
  router.
- [`../design.md`](../design.md) — current design doctrine, kept synchronized by a build gate.
- [`RELEASING.md`](RELEASING.md) — current release and deployment reference.
- [`../skills/README.md`](../skills/README.md) — current maintainer and consumer skill map.
- [`plans/2026-07-28-public-site-private-registry-boundary.md`](plans/2026-07-28-public-site-private-registry-boundary.md)
  — current production boundary: every non-registry route is public and only `/r/*` is private.

For current package versions and registry inventory, query npm/the workspace and the machine
authorities named in `AGENTS.md`; do not copy a number from prose.

For local verification scope, `pnpm gates:plan` explains the dependency-aware shadow decision. Plans
and ledgers can be operational-only; MDX under `apps/docs/content` is rendered product input and is
handled separately. Unknown or disagreeing inputs widen, and final production ship remains full.

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
- [`ledger/`](ledger/) — append-only implementation, bug, review, and operator-judgment history.

## Current status

The public npm packages and private registry are shipped. `design.vegastack.com` is public on every
non-registry route, including the unlisted/`noindex`/`no-store` `/internal/*` operations pages; only `/r/*`
requires a Cloudflare Access service token. Every production dispatch proves this one boundary.

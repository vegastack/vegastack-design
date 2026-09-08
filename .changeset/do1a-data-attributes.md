---
"@vegastack/ui": patch
---

🛠 **`verify-component-contracts --write-data-attributes`** records each registry part's
`data-*` attributes and CSS variables in `component-contracts.json`, extracted from the canonical
source through the TypeScript AST, so the docs API tables and the agent markdown export list them.
The default mode fails when the contract drifts from the source, and a `--self-test` drifts a
`dataAttributes` record in memory and requires the reconciliation to reject it — so the gate cannot
pass by never having run.
[docs](https://design.vegastack.com/docs/components/dialog)

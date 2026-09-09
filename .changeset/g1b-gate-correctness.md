---
---

🛠 **Gate correctness (G1-b)** — four fail-opens closed, and focus indication covered again.
`packages/ui/test/{contrast,stacking}.css` imported only part of the layer set production ships, so
every custom `@utility` a fixture wore compiled to nothing and both lanes measured a page no user
sees; `verify-test-css-layers` now derives the required set from the shipped preset and fails
closed. `pnpm lint` gains a repo-wide `prettier --check`. A changeset may no longer link a commit —
the only sha it can name is a pre-merge one the squash orphans — and `changelog-lint`'s own probe
became reachability rather than mere object existence. Eleven cases in the workflow-security
negative harness matched literals that can drift; one of them had never exercised its own rule.
The geometry lane gains a focus-indicator assertion over all 541 fixtures that rejects the browser's
own ring by name, `packages/ui/test` finally type-checks, `verify-component-contracts` derives the
inventory counts from the registry instead of hard-coding them, six token-vocabulary design-lint
rules land with negative fixtures, and `verify-token-references` fails closed on a `--token` that
does not exist.

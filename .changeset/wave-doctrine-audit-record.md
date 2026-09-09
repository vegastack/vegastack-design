---
---

📚 Docs

- Corrected the shipped **0.1.0** changelog entry: the initial release carried **83 components**, not
  75 (and the docs showcase had 99 pages, not 91). Recomputed against the release commit with the
  repository's own path-derived classifier, which counts `icon-button` as the component it is. The
  animated-icon and hook figures were already right.
- Replaced the hand-maintained runner roster in the Linux CI runbook — and its two copies elsewhere —
  with the one `gh api` command that returns live truth, keeping only the per-host facts that command
  cannot return.
- Reconciled the hover/pressed rule in AGENTS.md and design.md with what `tooling/design-lint.mjs`
  actually enforces (`hover-without-pressed`), and added the `sr-only` accessible-name separator to
  design.md § Accessibility as doctrine.
- `verify-component-contracts` no longer tells the reader to run a command that cannot fix a drifted
  `expectedCounts` key.
- Versioned the audit epic's orchestration briefs into the repo, and recorded the epic's review
  rounds — three Codex, the rest independent Opus reviewers — in the ledgers.

---
---

🛠 CI: the mac minis run two runner agents on one machine sharing one home directory, and
`pnpm/action-setup` defaulted its bootstrap directory to `~/setup-pnpm` — which it deletes on every
job, and which `PNPM_HOME` also made the package store. Concurrent jobs raced that deletion into
`ENOTEMPTY` (or a half-linked `node_modules` that turbo reported as `unable to spawn child process`)
before any repository code ran, and the store never survived a job, so every macOS install
re-downloaded the whole dependency graph. Each mac-mini job now bootstraps into
`${{ runner.temp }}/setup-pnpm` and installs with `--store-dir "$RUNNER_WORKSPACE/pnpm-store"` —
per-agent, and persistent — and the three jobs that enabled `setup-node`'s package-manager cache no
longer do, since it cached the directory the next job deleted. `verify-workflow-security.mjs`
asserts all three, with negative-harness cases for each; two of its existing cases that matched the
install by literal command line were rewritten to match by shape.

---
---

🛠 **`pnpm verify:release`** — discards the docs build cache before the first export so a stale Turbopack cache can no longer report the docs shell as off-system, and the registry idempotency check now compares before/after instead of demanding an empty tree.

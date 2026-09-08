---
---

🛠 **`verify-docs-export`** fails the docs build on any JSX tag surviving outside a code
fence, any unresolved export placeholder, or any empty API table — the regression guard for the
markdown export — and enforces that a page carries either a curated playground or the Story explorer,
never both. It ships a negative self-test, so it cannot pass by never having run.

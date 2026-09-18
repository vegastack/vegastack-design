---
---

🛠 `version-sync` now walks the whole component-contracts document when it rewrites public dependency ranges instead of iterating three named categories, so a category added later — chart blocks, libs, the animated-icon shared contract — cannot be left at the previous range and fail `verify-component-contracts` on the Version Packages PR.

---
---

🛠 **`verify-docs-base-mirror`** diffs the rule blocks `apps/docs/app/global.css` hand-copies
from `base.css`, which had no gate. It counts `@apply` as a declaration: the focus ring is expressed
only that way on both sides, so filtering `@`-prefixed lines compared that block as empty against
empty and could never fail. It ships a negative self-test.

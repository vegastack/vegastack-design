---
"@vegastack/design": minor
"@vegastack/design-tokens": minor
---

Publish the unified VegaStack design doctrine as generated DTCG-backed `design.md` data, add the
named strong-type and effect roles, keep dark and marketing themes in exact parity, and normalize
animated icons to React 19 ref props with intrinsic reduced-motion behavior.

Add the `@vegastack/design/theme-scope` subpath for the `@internal` portal theme-scope plumbing.
It is a client module (module-scope `React.createContext`), so it is deliberately NOT re-exported
from the root entry — the root stays importable from a React Server Component, which is what every
server-safe component relies on when it imports `cn`.

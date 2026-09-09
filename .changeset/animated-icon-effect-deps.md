---
"@vegastack/design": minor
---

🐛 **Animated icons** — the reduced-motion effect ran after _every_ render in all 439 icons,
because it was written without a dependency array. It now runs when the preference changes, once, in
the factory.
[docs](https://design.vegastack.com/docs/foundations/icons)

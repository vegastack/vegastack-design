---
"@vegastack/ui": minor
---

New `shortcut-overlay` component — the `?`-triggered dialog listing keyboard shortcuts, rendered
from a declaration registry (keys, label, category, optional `when`) instead of hand-listed markup,
so the surface cannot go stale. Shortcuts group by category in declaration order, render as
description-list pairs with real `Kbd` keys whose modifier glyphs follow the user's platform via
`use-platform`, and large sets get an automatic filter. The global binding never fires from a text
field and defers to a `shouldHandle` predicate while another overlay owns the keyboard.

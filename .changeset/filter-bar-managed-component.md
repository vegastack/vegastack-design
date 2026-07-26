---
"@vegastack/ui": minor
---

New `filter-bar-managed` component (`FilterBuilder`) — the stateful nested and/or filter builder
the `filter-bar` docs recorded as deferred. The grammar is host-injected: the component owns the
tree shape (`FilterNode` groups and conditions) and its editing surface, while the app supplies the
field `vocabulary` (operators per field, `requiresValue`, formatting) and a per-type `editors`
registry (text is built in). Nested groups render as fieldset/legend — deliberately not
`role="tree"` — with depth and condition caps whose disabled add affordances carry readable
reasons, a missing-value check with visible text, focus-managed removal (next sibling, else the
group's add button), and a `readOnly` summary of removable `FilterChip`s. It never validates field
semantics, never serialises, and never executes the filter — that would adopt one app's AST.

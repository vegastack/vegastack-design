---
"@vegastack/design": minor
---

Adds `mergeRefs` — fan one DOM node out to several refs (a forwarded `ref` prop plus one or more
internal refs) as a single ref callback, handling both shapes React 19 accepts and skipping
`null`/`undefined` entries. It was exported from the `use-animation-replay` registry item, an odd
home for it, while nine registry files hand-inlined the same `typeof ref === "function"` merge;
ref-as-prop makes "the component needs the node AND has to forward it" the normal case, so it
belongs in the package. Typed against React's ref shapes with a type-only import, so the entry
stays server-safe.

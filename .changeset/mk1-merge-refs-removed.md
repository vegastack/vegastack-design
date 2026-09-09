---
"@vegastack/ui": minor
---

🗑 **`mergeRefs` no longer ships from the `use-animation-replay` registry item, and
`media-player-controls` no longer exports `assignRef`.** Both were spellings of the same merge; the
one implementation now lives in `@vegastack/design` and every registry file imports it there
alongside `cn`. `grep -rn 'typeof ref === "function"' packages/ui/registry/ui` is 0.
[docs](https://design.vegastack.com/docs/guides/components)

---
"@vegastack/design": minor
---

Exports the `prose` recipe — one token vocabulary for rendered rich text, so a surface the system
did not author element by element (markdown, a contenteditable, CMS copy) is styled by one class on
its root. `proseClassName` is the whole recipe; `prose` is the per-element record it composes from,
keyed by the `ProseElement` type.

It is expressed as descendant variants (`[&_h1]:…`) because neither consumer can put a class on the
elements — ProseMirror owns the editor's DOM, and react-markdown's output is reachable only through
an override map — and because an element-level class silently LOSES the cascade to a root-level
descendant rule (specificity (0,1,0) against (0,1,1)). Restyle prose by composing `prose`, never by
setting a class on the rendered element.

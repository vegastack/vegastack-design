---
"@vegastack/ui": minor
---

Rich text is one recipe, and the bars that promise arrow-key traversal now implement it.

- **MarkdownView and TextEdit share the `prose` recipe.** Both restated the same heading, paragraph,
  list, quote and code recipe in their own grammar and had already drifted (`h4`–`h6`, tables and
  images existed on one side only). They now wear the same class from `@vegastack/design`, so
  rendered markdown and edited rich text are one typography — asserted by comparing computed styles,
  not class names. TextEdit's fenced-code block stops being a third copy of `CodeBlock`'s surface,
  and the editor's links no longer all light up when the editor itself is hovered.
- **TextEdit's formatting row is a Base UI `Toolbar`** — one tab stop, arrow keys across three
  labelled groups, `Shift`+`Tab` out. It was a `role="toolbar"` of eight independent tab stops.
- **ActionBar is a Base UI `Toolbar`** with new `ActionBarButton` and `ActionBarSeparator` parts.
  Compose the actions from them: a toolbar builds its single tab stop from the items that register
  with it, so a bare `<Button>` renders but keeps its own tab stop.
- **ActionBar and MessageScrollerButton use the shared `motion-dock-in` / `motion-dock-out` pair**
  instead of two copies of a recipe that exited more slowly than it entered, with a scale on a bar
  that slides off its own edge.
- **MessageScrollerButton defaults to `variant="outline"`** with no inline colour override — after
  the Button matrix, `outline` already is a page-coloured face with the one hairline and the
  surface-ladder hover.

---
"@vegastack/ui": patch
---

🧩 **TextEdit** editor tools (B.2):

- **Block menu:** a click on the ⋮⋮ handle, or ⇧F10 / the context-menu key, opens Turn into ▸ (Callout ▸ by tone, Toggle), Duplicate (⌘D), Copy link, Copy as Markdown, Move up / down, Open by default and Delete. On touch it is a bottom sheet, the handle follows the caret, and a drag needs a 350ms hold. Drags auto-scroll at the window's edge, and in a shared document a drop re-resolves the block by its Yjs position.
- **Find and replace:** `findReplace` adds a docked bar (⌘F, ⌘G, RE2 regex, Replace all as one undo step) and `handleRef.openFind()`.
- **Emoji:** `emoji` adds a `:` menu.
- **Heading links:** `headingLinkHref` adds a `#` copy link on the hovered or caret heading. `scrollToHeading` now takes `<slug>~<blockId>`, opens toggles and returns whether it found the heading.
- **Word count:** `onStatsChange` / `getStats()`, counted when idle.
- **Toggles:** `toggleState` persists each viewer's toggles. Find results, links, comments and the caret open the toggles around them for the moment.
- **Host slash items:** `slashActions` adds host `/` items after the built-in ones, and `insertMention` inserts a mention chip.
- **Outline:** items carry `blockId`, and a shared document no longer rebuilds heading decorations on every change.

**SuggestionMenu**: an option can be `disabled`.
[docs](https://design.vegastack.com/docs/components/text-edit)

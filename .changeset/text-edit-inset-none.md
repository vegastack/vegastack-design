---
"@vegastack/ui": patch
---

🔧 **TextEdit** takes `inset="none"` so it can sit flush with a ghost **Input** or **Textarea** title above it. Inside a Dialog, Sheet, Drawer, Popover or Card whose padding is narrower than the block grip needs, TextEdit adds start padding (about 10px in a Dialog) so the ⋮⋮ grip sits before the text. That pushed a New task dialog's "Add a description…" right of its title. With `inset="none"` the text, placeholder and caret start at the editor's own edge, and the block grip is not shown. The block menu still opens from ⌘/ or ⇧F10, and on touch from a long-press (implied, whatever `touchBlockMenu` says); ⌘⇧↑ and ⌘⇧↓ still move blocks, and tables keep their grips. The default, `inset="auto"`, is unchanged. [docs](https://design.vegastack.com/docs/components/text-edit)

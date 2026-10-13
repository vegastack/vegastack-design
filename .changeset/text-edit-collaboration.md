---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **TextEdit**: `collaboration={{ document, provider, user }}` edits a shared Yjs document live — collaborators' carets and selections in their tag hue with their name (an agent in purple), ⌘Z undoing only this viewer's changes, nothing serialized per keystroke, and the editor mounted at once (read-only viewers watch it move; `readCopy` paints first). A toggle's chevron is each viewer's own ("Open by default" in its ⋯ menu sets it for everyone), a page, task or file mention is stored without its title and labelled per reader by the new `mentionLabel`, and a comment made here carries `anchor.y` Yjs positions (`TextEditAnchor`) that keep the highlight on its words. The slash and `@` menus take spaces and digits (`/heading 2`, `/head2`, `@Asha Rao`); `handleRef.pendingUploads()` and `onPendingUploadsChange` report uploads still landing. **AutoSaveIndicator** adds `connecting` and `offline`; **InlineChip** and mentions add the `agent` kind ("Your agents"). `docToMarkdown(doc, { labels })` fills label-less mentions. New dependencies `yjs`, `y-protocols`, `@tiptap/y-tiptap` and `@tiptap/extension-collaboration(-caret)`, in the editor's lazy chunk.
[docs](https://design.vegastack.com/docs/components/text-edit)

---
"@vegastack/ui": patch
---

🔧 **TextEdit**: choosing a type in the block menu's **Turn into** closes the menu, and a menu whose block left the page closes with it, so the block grip never disappears for the rest of the page. ⌘/ (Ctrl+/) opens the block menu for the caret's block, as ⇧F10 does. ⌘K and the image, video, audio and file panels refuse text that isn't a link, inline: they take a web address, a bare domain, `mailto:`/`tel:` (links only) or a path, never saving "https://not a url". Replacing an image, by upload, import or link, keeps its alt text and caption. Choosing an insert panel's **Link** tab puts the caret in its field. **FileViewer**: a small image opens at its own size, never upscaled. **MermaidBlock**: a diagram that can't be drawn says "Couldn't draw this diagram — check line 2." with the parser's words behind **Details**.

---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 TextEdit fixes from a live check. Slash and mention menu items use `DropdownMenuItem`'s look (accent highlight, radius, padding, shortcut text), and the active item is marked `data-selected="true"` so apps that map the variant to `="true"` show it. Callouts render their text as the `Alert`'s description, in the tone colour, with the tone icon in colour. Code blocks scroll unwrapped lines sideways in the editor too (Tiptap's content element no longer forces `pre-wrap`). A closed toggle hides only its body, not its title. Images: a thin outline at the image's own radius when selected, Notion-style side handles only, no extra spacing, and a blurred hover toolbar (Open, Download, Copy link, ⋯ Replace / Delete). A file chip opens in the `FileViewer` on a double-click or from the link panel's Open.

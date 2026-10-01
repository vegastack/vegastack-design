---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 New `InlineChip`: the one inline reference — a person, page, file, task, meeting, customer or project — for `TextEdit`, `MarkdownView` and `Comments`. It is an inline box on the text's baseline (no more label riding above the line), sized by the surrounding text with a 1em icon, tinted per kind from the tag hues, and wraps cleanly. A person chip shows its photo and previews avatar, name and email on hover or focus; other chips open on click (`onOpen`, e.g. a file in `FileViewer`, else `href`), ⌘/Ctrl-click opens a new tab, and `preview` adds a small hover card (`InlineChipPreview`). `InlineChipProvider` resolves `href`, `person`, `preview` and `onOpen` for every chip below it. `MentionChip` and file links now render through it, and mentions gain the `meeting`, `customer` and `project` kinds.

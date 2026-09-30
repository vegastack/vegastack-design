---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 `MarkdownView` takes `citation`: a `[[n]]` marker (n = 1–999) renders as a small superscript `n` — a muted pill button named by the source's `label` that opens its `content` on hover, keyboard focus or a long press and calls `onSelect` on a click or tap. A marker without a source, every marker without the prop, and markers in code or link text stay literal. `TextEdit` passes `citation` to its read view, where pressing a marker never starts editing. `Transcript` takes `reveal={{ id, key }}`: the row scrolls to centre, takes the accent wash for a moment, and following pauses.

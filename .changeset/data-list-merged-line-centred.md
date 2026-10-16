---
"@vegastack/ui": patch
---

🐛 **DataList** `mergedLayout="line"`: every value sits on the line's centre. A person (a flex row of avatar and name) no longer drops to a second line under its dot, and a chip or a time with its 24px tooltip target lines up with the plain text and the dots. A `"—"` wrapped in a plain element (`<span className="tabular-nums">—</span>`) now drops with its dot, like a bare one.

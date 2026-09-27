---
"@vegastack/ui": patch
---

🔧 Editable values in a `PropertyValue` line up exactly with read-only ones: an inline `EditableCell` there keeps the plain values' left edge, baseline and row height at rest, on hover and while editing, with a compact tint (6px × 2px, hung outside by negative margins) instead of an offset 10px × 6px box. A ghost `RecordChip` (the property pickers) now draws the same compact 24px box, so every editable property value reads the same.

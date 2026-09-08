---
"@vegastack/ui": minor
---

🔧 **`TruncatedText` gains `focusable`,** with a `TruncationFocusProvider` that sets it for a
whole region. Clipped text becomes a Tooltip trigger and takes a tab stop — in a 50-row table that is
50 extra tab stops layered on a grid's own roving focus, and CSS truncation never hides anything from
a screen reader, so the tooltip only ever served sighted keyboard users. `IconText`, `TableCellText`
and `RelativeTime` take the same prop.
[docs](https://design.vegastack.com/docs/components/truncated-text)

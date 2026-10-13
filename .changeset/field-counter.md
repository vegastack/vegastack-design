---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **Field**: `FieldCounter` — a character counter for `Input` and `Textarea` at the end of the label row (`FieldHeader`), so it takes no room under the control. `<FieldCounter value={bio} maxLength={100} threshold={0.8} />` shows `92/100` (12px, muted, tabular) only from `threshold` of `maxLength` (default 0.8), in the destructive ink at the limit. Inside a `Field` it describes the control (`aria-describedby`) while it shows, and a polite status speaks only at its thresholds ("8 characters left", "Character limit reached"), never per keystroke.
[docs](https://design.vegastack.com/docs/components/field)

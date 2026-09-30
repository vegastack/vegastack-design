---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 `AutoSaveIndicator` takes `variant="icon"`: the status as one 16px icon for a field's trailing slot — a muted spinner while saving, a success check once saved that fades out when the status returns to idle, and a destructive warning triangle on error (warning ink on conflict). Each state pops in (fade plus a 0.9 → 1 scale), the box is always reserved, and the wording stays as screen-reader text in the live region. In a textarea `InputGroup`, an inline addon now sits top-aligned with the first line instead of mid-height (FRM-16), so a status icon lands in the top-right corner.

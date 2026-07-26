---
"@vegastack/ui": minor
---

New `chip-input` component — free-token entry for tags, recipients, domains, and webhook events.
Enter/comma/paste-split commit chips; Backspace in the empty input removes the last one. The field
chrome is the Combobox input group's (borrowed literally, retargeted at the inner real `Input` — no
raw `<input>`, no lint exemption), the chips are real `Tag`s with named 24px remove targets.
Validation is per-chip and non-destructive: invalid entries are added and flagged (`data-invalid` +
destructive outline-border pair + text description) rather than silently dropped, duplicates are
rejected and announced, and all outcomes flow through a polite live region.

---
"@vegastack/ui": minor
---

🔧 `DocumentLayout`'s text column is a fixed 720px (45rem) reading width at every tier, the same as a prose page or a settings form (`ShellPage size="prose"`/`"form"`), centred in the room the layout has (operator, 17-11-2026: "Fix at 720 px"). It was fluid between 36rem and 64rem by tier. The text sits centred in the room the comment margin leaves (opening comments slides it to the start by half the margin, instead of holding it in place), and inside a record page whose side panel docks the layout narrows and the text re-centres the same way; the contents rail keeps its fixed gap in the start gutter. `measure="wide"` is unchanged.

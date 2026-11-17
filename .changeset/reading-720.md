---
"@vegastack/ui": minor
---

🔧 `DocumentLayout`'s text column is a fixed 720px (45rem) reading width at every tier, the same as a prose page or a settings form (`ShellPage size="prose"`/`"form"`), centred in the room the layout has (operator, 17-11-2026: "Fix at 720 px"). It was fluid between 36rem and 64rem by tier. Inside a record page whose side panel docks, the layout narrows and the text re-centres in what is left; the contents rail stays in the start gutter and the comment margin after the text. `measure="wide"` is unchanged.

---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🐛 A long text whose first line ends in a hard break (<kbd>Shift</kbd>+<kbd>Enter</kbd>) no longer shows a trailing backslash at rest in a grid cell or a **FieldProperty** row: `typedFirstLine` drops the break's marker (`\` or two trailing spaces) when it takes the first line. [docs](https://design.vegastack.com/docs/components/field-cell)

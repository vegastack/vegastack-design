---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🧩 **FormulaInput** (new): a calculated field's formula on one line. `fields` (`FormulaInputField[]` — `{ key, label, type? }`) are offered when you type `{` and inserted as chips; `*` and `/` read as × and ÷ (`operators`); the value is text with `{{key}}` tokens. Under the input, `preview` shows the first row's result ("First row = 1,240", `previewLabel`) and `error` takes its place, marks the input invalid and is announced politely; `invalidFields` marks a chip invalid. Built on **TemplateEditor**, which gains `triggers` (`"@" | "{{" | "{"`, default `["@", "{{"]`) and `pickerLabel` (default "Insert placeholder"). [docs](https://design.vegastack.com/docs/components/formula-input)

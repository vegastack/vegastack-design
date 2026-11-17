---
"@vegastack/design-tokens": minor
"@vegastack/ui": minor
---

🔧 **A text field's rest, hover and focus borders are three even steps in both themes** (FOC-14). New token `input-focus` carries the focus border that `border-ring/50` drew; `input` at rest is firmer in light (1.44:1, was 1.26:1, so the unchecked Switch track and ButtonGroup separators darken with it) and `input-hover` sits between: rest 1.44, hover 2.10, focus 3.26:1 on the page in light and 1.47, 2.10, 3.29:1 in dark. Focus holds 3:1 on every neutral surface, and `contrast-check` now gates the three steps in order. Input, Textarea, InputGroup, Combobox, InputOTP, Questionnaire, TextEdit and the composers use `border-input-focus`.

---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **TextEdit** `diff={{ doc, baseline }}`: a version diff, formatted and read-only — added text and blocks underlined on the success tint, removed ones struck through (`ins`/`del`, announced "Added:"/"Removed:"; changed images outlined), under `Compared with {baseline}`. `text-edit-schema` adds `TextEditDiff` (the `ychange` mark and block attribute a Yjs snapshot diff produces, never in a live document — whose schema now refuses it), `textEditDiffSchema()` (`textEditExtensions({ diff: true })`, code blocks take the change mark) and `ychangeType()`. A diff view never fires `onValueChange`/`onCommit` and ignores `value`.
[docs](https://design.vegastack.com/docs/components/text-edit#version-diff)

---
"@vegastack/ui": patch
"@vegastack/design": patch
---

🔧 **TextEdit** `diff={{ doc, baseline }}`: a version diff, formatted and read-only — added text and blocks on the success tint, removed ones struck through (`ins`/`del`, announced "Added:"/"Removed:"), under `Compared with {baseline}`. `text-edit-schema` adds `TextEditDiff` (the `ychange` mark and block attribute a Yjs snapshot diff produces, never in a live document's schema), `textEditDiffSchema()` and `ychangeType()`.
[docs](https://design.vegastack.com/docs/components/text-edit#version-diff)

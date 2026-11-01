---
"@vegastack/ui": patch
"@vegastack/design": patch
"@vegastack/design-tokens": minor
---

🗑 Text fields no longer draw a focus ring (FOC-16 amended; Regent operator, 2026-11-01). `Input`, `Textarea`, `InputGroup` and the `Combobox` chips field show focus as the `ring/50` border alone, and an invalid field keeps only its destructive border. The `field-halo` and `field-halo-destructive` utilities and the `--input-halo` token are removed; re-pull those components and drop any direct use.

---
"@vegastack/design-tokens": minor
---

🐛 **Text-entry focus under forced colours, on a field with addons, where the outline was being
clipped.** A bordered field group — Input's prefix/suffix wrapper, NumberField's stepper group,
ChipInput, the Combobox input-group — clips with `overflow-hidden` so its addons follow the rounded
corner, and the inner input's outline is offset outward into that clip. It was drawn and then cut,
so an addon field still had no visible focus under the forced palette. The group carries the outline
now (via a bare `data-field-group` attribute that `base.css` hooks) and the control inside stands
down, so the two never double-ring.
[docs](https://design.vegastack.com/docs/components/input)

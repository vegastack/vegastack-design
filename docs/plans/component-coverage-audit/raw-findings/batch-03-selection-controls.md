# BATCH 3 — Selection Controls, Form & Inputs

## BATCH SUMMARY

- **Audited:** 6 components (checkbox, switch, radio-group, slider, label, field)
- **Major-gap count:** 2 — **label** (stale Accessibility/Required prose: docs describe a `text-destructive` asterisk that the component deliberately does NOT render; the "States" section has no preview), **checkbox** (no `size`/`sm` preview anywhere despite a documented Sizes section — only static code block; `aria-invalid`/error state never demonstrated).
- Minor/medium gaps on switch, radio-group, slider, field (mostly: error/invalid state undemonstrated, no AutoTypeTable for sub-export types, a couple matrix gaps).

| Component   | Proposed category  | One-line reason                                                          |
| ----------- | ------------------ | ------------------------------------------------------------------------ |
| checkbox    | Selection Controls | Binary/tri-state tick toggle for multi-select & form submission.         |
| switch      | Selection Controls | Instant on/off toggle for self-saving binary settings.                   |
| radio-group | Selection Controls | Mutually-exclusive single-choice set with roving arrow-key nav.          |
| slider      | Form & Inputs      | Continuous numeric / range picker (drag + keyboard).                     |
| label       | Form & Inputs      | Styled native `<label>` for associating text with a control.             |
| field       | Form & Inputs      | Form-field wrapper (label + description + error/success) over a control. |

---

## checkbox

- files: canonical ✓ | test ✓ | mdx (`checkbox.mdx`) ✓ | preview ✓
- exports/subcomponents: `Checkbox`, `checkboxVariants`, `CheckboxProps`
- proposed category: Selection Controls — binary (or tri-state) tick toggle that submits its value in a form

### API surface (ground truth)

- CVA axes: `size` = `default` (size-4) | `sm` (size-3.5). (`checkbox.tsx:30-34`)
- boolean/enum props: `checked`, `defaultChecked`, `indeterminate`, `disabled` (canonical:48-71); inherited Base UI: `required`, `name`, `value`, `id`, `nativeButton`, `inputRef`, `onCheckedChange`, `render`.
- states: unchecked / checked / indeterminate(`aria-checked="mixed"`, Minus icon) / disabled / disabled-checked / hover (`hover:border-ring/70`) / focus-visible ring / invalid (`aria-invalid:border-destructive/70 data-invalid:border-destructive/70`, canonical:24) / group-disabled (`group-has-disabled/field`).

### Currently demonstrated

- preview exports → `checkbox` (single Field+Checkbox, hero); `checkboxStates` (unchecked, checked, indeterminate-controlled, disabled, disabled-checked — bare + 4 Field-wrapped rows).
- mdx sections: Installation, Usage, With a Field, Sibling label, States (preview), Sizes (CODE ONLY), API Reference (AutoTypeTable ✓ `CheckboxProps`), Accessibility (+ key table), Do/Don't. AutoTypeTable present & correct.

### GAPS

- [VARIANT] `size="sm"` is documented (Sizes section) but **never rendered** — the Sizes section is a static code block, no `<ComponentPreview>`. The `sm` box + scaled-down icon are never shown. (mdx:66-73)
- [VARIANT] `aria-invalid` / `data-invalid` destructive-border state (canonical:24) is never demonstrated — no error/invalid checkbox in any preview, and Checkbox-in-Field with `error` not shown.
- [VARIANT] Hover state (`hover:border-ring/70`, canonical:21) not surfaced (acceptable — interactive-only, but no note).
- [MATRIX] No size×state grid. The Sizes code block shows `sm`/`default` unchecked only; checked/indeterminate at `sm` never shown. A small `state × size` grid would add signal given the icon scales with the box.
- [API] none — AutoTypeTable present and matches `CheckboxProps`.
- [PROSE] none material. Usage/Accessibility match canonical (role, hidden input, `aria-checked` mixed, focus ring, `nativeButton` for sibling label all accurate).
- [STRUCTURE] Standard sections present; Sizes section exists but is preview-less (thin).

### Verdict

- coverage: ~75% — strong state coverage, but the documented `sm` size and the invalid state are undemonstrated.
- effort: **M**
- top 3 fixes: (1) add a `checkboxSizes` preview export and wire `<ComponentPreview>` into the Sizes section; (2) demonstrate the invalid/error checkbox (e.g. inside `<Field error=…>`); (3) optionally add a `state × size` grid so the scaled `sm` indicator is visible.

---

## switch

- files: canonical ✓ | test ✓ | mdx (`switch.mdx`) ✓ | preview ✓
- exports/subcomponents: `Switch`, `switchVariants`, `switchThumbVariants`, `SwitchProps`
- proposed category: Selection Controls — on/off toggle for instant, self-saving binary settings

### API surface (ground truth)

- CVA axes: `size` = `sm` (h-4 w-7 / 16px) | `default` (h-5 w-9 / 20px) | `lg` (h-6 w-11 / 24px). (`switch.tsx:23-30`, `63`)
- boolean/enum props: `checked`, `defaultChecked`, `disabled` (inherited Base UI), `onCheckedChange`, `nativeButton`, `name`, `value`, `render`.
- states: off (`data-unchecked`, `bg-track`) / on (`data-checked`, `bg-primary`) / disabled-off / disabled-on / focus-visible ring / `aria-invalid` (`aria-invalid:border-destructive/70`, canonical:20).

### Currently demonstrated

- preview exports → `switchExample` (Field+Switch hero); `switchSizes` (sm/default/lg, all `defaultChecked`); `switchStates` (off, on, disabled-off, disabled-on — bare row + 4 Field rows).
- mdx sections: Installation, Usage, Sizes (preview ✓), States (preview ✓), API Reference (AutoTypeTable ✓ `SwitchProps`), Accessibility (+ key table), Do/Don't.

### GAPS

- [VARIANT] All three sizes shown ONLY in the `on` (checked) state (`switchSizes`, preview:19-27). The `off` state of `sm`/`lg` is never rendered — off-state track height/thumb-inset at the non-default sizes is unverified visually.
- [VARIANT] `aria-invalid` destructive-border state (canonical:20) never demonstrated — no invalid switch / Switch-in-Field-with-error.
- [MATRIX] No `size × on/off` grid. Given the thumb-travel geometry differs per size, a 3×2 (size × state) grid would add real signal; current previews only cover size×on and default×{off,on}.
- [API] none — AutoTypeTable matches `SwitchProps`.
- [PROSE] Minor: States prose says "On, off, and disabled (in both positions)" — accurate. Description/Usage match canonical. No stale text found.
- [STRUCTURE] All standard sections present and ordered.

### Verdict

- coverage: ~80% — good; main holes are off-state at non-default sizes and the invalid state.
- effort: **S**
- top 3 fixes: (1) show `sm`/`lg` in the off state too (size×state grid); (2) demonstrate the invalid state; (3) (nice-to-have) a controlled example to mirror Usage's controlled snippet.

---

## radio-group

- files: canonical ✓ | test ✓ | mdx (`radio-group.mdx`) ✓ | preview ✓
- exports/subcomponents: `RadioGroup`, `RadioGroupItem`, `radioGroupVariants`, `RadioGroupProps`, `RadioGroupItemProps`
- proposed category: Selection Controls — mutually-exclusive single-choice set with roving arrow-key navigation

### API surface (ground truth)

- CVA axes (RadioGroup): `orientation` = `vertical` (flex-col) | `horizontal` (flex-row flex-wrap). (`radio-group.tsx:21-27`)
- boolean/enum props: RadioGroup → `value`, `defaultValue`, `onValueChange`, `disabled`, `orientation`, `aria-orientation`, `name`, `required`, `readOnly`. RadioGroupItem → `value` (req), `disabled`, `render`, `nativeButton`.
- states: item unchecked / checked (`data-checked:border-primary` + scaled-in `bg-primary` dot) / disabled-item / disabled-group / hover (`hover:border-ring/70`) / focus-visible ring / `aria-invalid` (`aria-invalid:border-destructive/70`, canonical:169) / group-disabled-field.

### Currently demonstrated

- preview exports → `radioGroup` (vertical Field-wrapped hero, default selected); `radioGroupStates` (controlled vertical group + a disabled-unselected and disabled-selected pair in separate groups).
- mdx sections: Installation, Usage, Anatomy, With a Field, Sibling labels, States (preview ✓), Orientation (CODE ONLY), API Reference (AutoTypeTable ✓ both `RadioGroupProps` & `RadioGroupItemProps`), Accessibility (+ key table, incl. arrow-nav), Do/Don't.

### GAPS

- [VARIANT] `orientation="horizontal"` is documented (Orientation section) but **never rendered** — it is a static code block, no `<ComponentPreview>`. The horizontal wrapping-row layout is never shown. (mdx:104-118)
- [VARIANT] `aria-invalid` destructive-border state (canonical:169) never demonstrated.
- [VARIANT] Selected (checked) item shown only in the hero/controlled previews; fine, but the dedicated States preview shows disabled-unselected + disabled-selected and a live group — no explicit standalone hover/focus note (interactive-only, acceptable).
- [MATRIX] No `orientation × state` view; at minimum a horizontal preview is missing. A horizontal group with a selected + disabled item would close both the orientation and matrix gaps at once.
- [API] none — both sub-export AutoTypeTables present (`RadioGroupProps`, `RadioGroupItemProps`).
- [PROSE] none material. Anatomy/Accessibility accurately describe roving tabindex, `aria-orientation`, `data-checked`, arrow-key move-selection. Matches canonical (incl. `aria-orientation` mirroring at canonical:111).
- [STRUCTURE] All standard sections present; Orientation section is preview-less (thin).

### Verdict

- coverage: ~75% — thorough prose + both API tables; biggest hole is the undemonstrated horizontal orientation.
- effort: **S/M**
- top 3 fixes: (1) add a `radioGroupHorizontal` preview and wire it into the Orientation section; (2) demonstrate the invalid state; (3) optionally show a horizontal group containing a disabled item (orientation × disabled matrix).

---

## slider

- files: canonical ✓ | test ✓ | mdx (`slider.mdx`) ✓ | preview ✓
- exports/subcomponents: `Slider`, `SliderProps` (single export; Base UI Root→Control→Track→Indicator→Thumb composed internally)
- proposed category: Form & Inputs — continuous numeric / range picker via drag + keyboard

### API surface (ground truth)

- No CVA axes (no size/variant). Props: `value`, `defaultValue` (number | number[]), `min` (0), `max` (100), `step` (1), `disabled`, `onValueChange`, `thumbAriaLabels`, `getThumbAriaLabel`, `render`, plus inherited `orientation`, `name`, `minStepsBetweenValues`, `aria-label`/`aria-labelledby`. (`slider.tsx:45-106`)
- states: single-thumb / range (n thumbs) / stepped / disabled (`data-disabled:opacity-50`) / focus-visible ring per thumb. `getThumbAriaLabel` callback + `thumbAriaLabels` array for naming.

### Currently demonstrated

- preview exports → `slider` (single, 40); `sliderRange` (`[20,80]` + thumbAriaLabels); `sliderSteps` (0–1000 step 50); `sliderDisabled`; `sliderControlled` (value mirrored to text).
- mdx sections: Installation, Usage, hero preview, Anatomy (Root/Control/Track/Indicator/Thumb), Range (preview ✓), Steps (preview ✓), Controlled (preview ✓), Disabled (preview ✓), API Reference (AutoTypeTable ✓ `SliderProps`), Accessibility (+ rich key table: arrows/PageUp/Home/End), Do/Don't.

### GAPS

- [VARIANT] `getThumbAriaLabel` (callback form, canonical:97-100) never demonstrated — only the `thumbAriaLabels` array variant is shown (in `sliderRange`).
- [VARIANT] Vertical `orientation` (inherited from Base UI Slider.Root) is neither documented nor demonstrated — if intended unsupported, the Anatomy/API should say so; otherwise it's an undemonstrated axis.
- [MATRIX] Disabled is shown only for a single-value slider (`sliderDisabled`, value 40); a disabled _range_ (two thumbs dimmed) is not shown. Minor.
- [API] none — AutoTypeTable matches `SliderProps`. (Comprehensive prop JSDoc → table is rich.)
- [PROSE] none material. Anatomy + Accessibility match canonical precisely (per-thumb hidden `<input type=range>`, `aria-valuenow/min/max`, fallback "Minimum/Maximum" naming at canonical:33-43). Keyboard table is the most complete in the batch.
- [STRUCTURE] Exemplary — every state has its own preview section. This is the best-covered component in the batch.

### Verdict

- coverage: ~90% — model coverage; only the `getThumbAriaLabel` callback and (maybe) orientation are untouched.
- effort: **S**
- top 3 fixes: (1) add a one-liner demoing `getThumbAriaLabel` (or note it as the dynamic alternative to `thumbAriaLabels`); (2) clarify vertical-orientation support (document or state out-of-scope); (3) (nice-to-have) a disabled range to round out the disabled state.

---

## label

- files: canonical ✓ | test ✓ | mdx (`label.mdx`) ✓ | preview ✓
- exports/subcomponents: `Label`, `LabelProps`
- proposed category: Form & Inputs — styled native `<label>` for associating text with a control

### API surface (ground truth)

- No CVA axes. Props: `required` (boolean, default false) + all native `<label>` props (`htmlFor`, `id`, `onClick`, …). (`label.tsx:6-15`)
- Behavior of `required`: sets `data-required=""` on the `<label>` — a styling/automation hook, **NO visual asterisk** (canonical:8-14, `data-required={required ? '' : undefined}` at line 45). Disabled-dimming via `peer-disabled:opacity-50` and `group-data-[disabled=true]:opacity-50` (canonical:48-49). Confirmed by tests: `label.test.tsx:27-33` asserts `data-required=""` AND that `[data-slot="label-required"]` is **null** ("No decorative asterisk").

### Currently demonstrated

- preview exports → `label` (Label+Input, htmlFor); `labelRequired` (required Full-name field + a `data-disabled` group showing the dim).
- mdx sections: Installation, Usage (preview ✓), Required (preview ✓), States (NO preview — prose only), API Reference (AutoTypeTable ✓ `LabelProps`), Accessibility (+ key/Click table), Do/Don't.

### GAPS

- [PROSE] **MAJOR / STALE — contradicts ground truth.** The docs repeatedly describe an asterisk the component does NOT render:
  - Frontmatter `description`: "…and an optional **required indicator**." (mdx:3)
  - Required section: "Pass `required` to append a **`text-destructive` asterisk** after the label text. The asterisk is decorative (`aria-hidden`)…" (mdx:34-36) — canonical renders no asterisk; `required` only sets `data-required`.
  - Accessibility: "The `required` **asterisk** is `aria-hidden`; mark the control `required`…" (mdx:57-59).
  - Do/Don't `dont`: "…rely on the **asterisk** alone — without `required` on the control…" (mdx:71).
    The component's own JSDoc is explicit: "(a styling/automation hook — **no visual asterisk**)" (canonical:9-13) and the test enforces no asterisk. **All four asterisk mentions are stale and must be rewritten** to describe `data-required` as a styling hook.
- [VARIANT] `required` IS demonstrated (`labelRequired`) but, because the component renders nothing visible for it, the preview shows no difference from a normal label — the docs imply a visible asterisk that the preview cannot show. The mismatch will confuse readers comparing prose to the rendered preview.
- [VARIANT] Disabled-dimming via `peer-disabled` (the `peer` sibling path) is described in States but the `labelRequired` preview only exercises the `group-data-[disabled]` path (`preview:27`), not `peer-disabled`. The `peer` variant is undemonstrated.
- [STRUCTURE] States section has **no `<ComponentPreview>`** — prose-only; the disabled dim is only incidentally shown inside `labelRequired`. Thin.
- [API] none — AutoTypeTable matches `LabelProps`.
- [MATRIX] n/a (no axes).

### Verdict

- coverage: ~55% — functionally covered, but the docs actively misdescribe the headline `required` behavior (asterisk that doesn't exist), making this a correctness/trust gap, not just a coverage gap.
- effort: **M**
- top 3 fixes: (1) **rewrite all 4 asterisk references** (description, Required section, Accessibility, Do/Don't) to describe `data-required` as a non-visual hook — match the canonical JSDoc and test; (2) give States its own preview that exercises both `peer-disabled` and `group-data-[disabled]`; (3) reconcile the `labelRequired` preview with the corrected prose (it currently implies a visible indicator).

---

## field

- files: canonical ✓ | test ✓ (+ `field-form.test.tsx` ✓, `field-inline.test.tsx` is the sibling component) | mdx (`field.mdx`) ✓ | preview ✓
- exports/subcomponents: `Field` (prop-driven), `FieldRoot`, `FieldLabel`, `FieldControl`, `FieldDescription`, `FieldError`, `FieldSuccess`, `fieldVariants`, types `FieldProps`/`FieldRootProps`/`FieldLabelProps`/`FieldControlProps`/`FieldDescriptionProps`/`FieldErrorProps`/`FieldSuccessProps`
- proposed category: Form & Inputs — form-field wrapper (label + description + error/success) over a control

### API surface (ground truth)

- CVA axes (FieldRoot/Field): `orientation` = `vertical` (label above) | `horizontal` (control before inline label). (`field.tsx:18-24`)
- `Field` props: `label`, `labelAction` (vertical only), `description`, `error`, `success` (ignored while `error`), `borderless`, `invalid` (defaults to `Boolean(error)`), `orientation`, `children` + inherited `FieldRoot`/Base UI Field.Root props (`name`, `disabled`, `validate`, `validationMode`, `touched`, `dirty`). (canonical:158-193, 232-292)
- Sub-parts: `FieldControl` renders `<Input>` (single source of field styling); `FieldError` renders `<div role="alert">` only when invalid/`match`; `FieldSuccess` is a plain `<p>` (no Base UI part). Form integration via RHF `Controller` + `onValueChange`/`invalid`/`touched` (proven by `field-form.test.tsx`).
- states: vertical / horizontal / error(invalid, role=alert) / success / borderless / disabled-group dim / labelAction row / focus-visible ring.

### Currently demonstrated

- preview exports → `field` (vertical Email+description hero); `fieldOrientations` (vertical input + horizontal Checkbox); `fieldStates` (error, labelAction+description, success, borderless — 4 vertical fields).
- mdx sections: Installation, Usage, Anatomy (all 6 primitives listed), Orientations (preview ✓), States (preview ✓), Form integration (RHF/Zod, peer-deps callout, code), API Reference (**7 AutoTypeTables** — `FieldProps`, `FieldRootProps`, `FieldLabelProps`, `FieldControlProps`, `FieldDescriptionProps`, `FieldErrorProps`, `FieldSuccessProps`), Accessibility (+ key table), Do/Don't.

### GAPS

- [VARIANT] `success` state is demonstrated in `fieldStates`, but the **horizontal error placement** (the `basis-full` error/success row under a horizontal field, canonical:284-288) is never shown — all error/success previews are vertical. The horizontal-with-error case (e.g. a required checkbox that errors) is undemonstrated.
- [VARIANT] `labelAction` is documented "Vertical orientation only" (canonical:167) — correct, and shown vertically; no gap, just noting it's intentionally vertical-only.
- [VARIANT] Disabled field (group dim via `group-has-disabled/field`, used by Label/Checkbox/Radio) is never demonstrated at the Field level — no `<Field disabled>` preview.
- [VARIANT] `invalid` prop used independently of `error` (e.g. `invalid` without an `error` message) not shown; `borderless` shown only with a single text control, not with a textarea/select (the BORDERLESS map targets input/textarea/select-trigger, canonical:199-203).
- [MATRIX] No `orientation × state` coverage — error/success only in vertical; horizontal only shown in the neutral (checkbox) case. A horizontal field with an error would add signal.
- [API] none — AutoTypeTable coverage is the most complete in the batch (all 7 prop types). Note `FieldSuccess`'s type is `ComponentPropsWithoutRef<'p'>` and is correctly tabled.
- [PROSE] none material. Anatomy, Accessibility, and the Form-integration section all match canonical and the two test files (RHF wiring is type-checked + run per `field-form.test.tsx`). Peer-dep callout is accurate.
- [STRUCTURE] Exemplary — full section set incl. Form integration. No thin sections.

### Verdict

- coverage: ~85% — excellent API/prose coverage; gaps are matrix-shaped (horizontal error/success, disabled field, borderless on non-input controls).
- effort: **M**
- top 3 fixes: (1) demonstrate a horizontal field carrying an `error`/`success` (exercise the `basis-full` row); (2) add a `<Field disabled>` example so the group-dim is visible at the Field level; (3) show `borderless` on a textarea or select trigger (the override map covers them but only input is shown).

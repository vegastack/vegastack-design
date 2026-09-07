---
title: "Fo1 · Forms: Field owns validation feedback, helper text below, one field chrome, inline-edit hook, control hovers"
labels: [audit-2026-09, components, forms, a11y]
---

## Context

Audit 2026-09-07, `02-batch-01-form-leaves.md` (B1-01, B1-06, B1-07, B1-11…B1-14, B1-16…B1-18),
`02-batch-08` B8-08, B8-09, `02-batch-09` B9-06, `07-state-probe.md` SP-02 (NumberField), SP-04
(Select/Checkbox hover). Depends on F1 (forced-colours fallback token rule, hover ladder) and F2
(`IconButton`). Decisions: D3 (labels stay 12px — doctrine edit), D4 (helper text below), D5
(`Field` owns the invalid shake), D6 (remove `selection:*`), D7 (disabled keeps pointer events),
D23 (`status` role for inline errors).

## Problem (see the batch file for `file:line`)

- B1-01: text-entry controls use `outline-none` + border tint, so under forced colours they have
  **no** focus indicator (measured).
- B1-07: helper text renders above the control; B1-12: the invalid shake is wired per component;
  B1-13: `selection:bg-primary` overrides native selection; B1-11: the field chrome (border, tint,
  invalid, disabled) is copy-pasted in Input, Textarea, NumberField (and OTP); B1-14: `Label` is
  `flex`; B1-16: no `CheckboxGroup` (Base UI has one).
- B9-06: `field-inline.tsx` re-implements EditableCell's edit/commit/cancel machine and uses
  `role="alert"` for its error; B8-08: PasswordInput hand-rolls its toggle and animates the eye
  swap; B8-09: AutoSaveInput `cn(className)` no-op, raw `size-4`, `Spinner label=""` hack.
- SP-02: NumberField `−`/`+` hover fills have square inner corners against the rounded field;
  SP-04: Select trigger hovers in dark but not light; Checkbox/Radio/Switch have no hover.

## Do

1. `fieldControl` recipe (one class string in `@vegastack/design`) for Input, Textarea,
   NumberField, OTP, Select trigger, Combobox input: border, focus tint, invalid, disabled — plus
   `@media (forced-colors: active)` outline fallback. Remove `selection:*`.
2. `Field`: helper/description **below** the control, error below that; `role="status"` for the
   message; owns `useShakeOnInvalid` (remove per-component wiring in ChipInput, NumberField, …).
3. `Label`: `inline-flex`/`inline` by default so it composes inline; keep a block variant.
4. `CheckboxGroup` registry item on Base UI `CheckboxGroup` (parent/indeterminate support).
5. `use-inline-edit.ts` hook (draft, commit, cancel, focus restore, double-commit guard) used by
   `FieldInline` and `EditableCell`; FieldInline hover → `surface-2`.
6. PasswordInput toggle → `IconButton variant="ghost" size="xs"`, no `motion-pop-in`, no
   `hasToggledRef`; fix the trailing-space class strings. AutoSaveInput: `Spinner decorative`
   prop, `size-(--icon-default)`, drop the no-op wrapper.
7. NumberField segments: `rounded-[inherit]`-derived inner radius (or `overflow-hidden` on the
   field + inset ring); Select trigger `hover:border-foreground/(--alpha-…)` in both themes;
   Checkbox/Radio/Switch unchecked hover border tint.
8. Tests/docs per B1-17/B1-18 (RTL fixtures for prefix/suffix, error+disabled combos, group
   keyboard). Doctrine: `design.md` §Forms — labels `text-label-sm` (12px), helper below, Field
   owns feedback; §Focus — the border-tint grammar with its forced-colours fallback.

## Acceptance

- `probe-forced-colors.mjs` shows a visible focus indicator on every text-entry control.
- `grep -rn "selection:" packages/ui/registry/ui` → 0; `useShakeOnInvalid` imported only by
  `field.tsx`; `fieldControl` imported by ≥5 components.
- `probe-states.mjs --routes input,select,checkbox,radio-group,switch,number-field,field-inline,
password-input` → 0 `hover-invisible` on triggers/controls, 0 `hover-touches-border`.
- `pnpm gates:component` on every touched form component; axe clean.

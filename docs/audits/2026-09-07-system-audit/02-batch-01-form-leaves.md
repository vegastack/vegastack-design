# 02 — Batch 1: form leaves

**Items:** button · icon-button · input · textarea · label · field · checkbox · radio-group · switch ·
slider · number-field · otp-input (+ `use-animation-replay`, consumed by five of them)
**Evidence:** source read line-by-line; docs pages rendered at 320/768/1280, light + dark, LTR + RTL
(`captures/<route>/`); computed metrics (`record.json`); axe on every fixture; keyboard Tab walk;
a dedicated forced-colours probe (`probe-forced-colors.mjs` → `captures/probe-forced-colors.json`).
**Severity:** high = ships a defect or a doctrine violation users can see/feel · medium = inconsistency
or bloat · low = polish.

Overall: this batch is in good shape. Tests are unusually strong (real hit-area probes, focus-preserving
shake, axe per state). The findings below are mostly _system_ decisions that these leaves expose, and
they propagate to everything downstream — which is exactly why this batch went first.

## Findings

### B1-01 · HIGH · a11y · Text-entry fields have no focus indicator under forced colours

- **Where:** `packages/ui/registry/ui/input.tsx:82,189` · `textarea.tsx:43` · `otp-input.tsx:137` ·
  `number-field.tsx:228` (and, probed ahead: `combobox.tsx` input, `auto-save-input`).
- **What:** every text-entry control strips the outline with `outline-none` and relies on the
  `focus:border-ring/(--alpha-tint-border)` tint. Under `forced-colors: active` the browser replaces
  `border-color`, so the tint vanishes, and `outline-none` (unlike Tailwind's `outline-hidden`) leaves
  `outline-style: none` in force. **Measured:** with forced colours on, a focused Input, Textarea, OTP slot,
  NumberField input and Combobox input all report `outline: none` and a border identical to the unfocused
  state. A Windows High Contrast user cannot see where the caret is.
- **Why it shipped:** the contract focus check is fail-open (documented in `docs/ledger/bugs.md`,
  2026-07-25) and design-lint's `outline-none` rule is file-scoped (it sees the border tint and passes).
- **Fix (root):** replace `outline-none` with `outline-hidden` on every text-entry control
  (`outline: 2px solid transparent` — invisible normally, painted by the forced palette). Add a design-lint
  rule: `outline-none` is banned on `input`/`textarea`/`[contenteditable]` slots; `outline-hidden` is the
  sanctioned form. Add one browser test per text-entry control under `forcedColors: "active"` asserting
  `outline-style !== none`. Then fix the contract suite's focus check (separate issue, already ledgered).

### B1-02 · HIGH · doctrine · `secondary`, `muted` and `accent` are one colour wearing three names

- **Where:** `packages/design-tokens/dist/theme.css` — light `oklch(0.97 0.003 75)` ×3, dark
  `oklch(0.269 0.003 75)` ×3. `design.md` §Surfaces describes a five-rung ladder in which **Subtle**
  (`secondary`) and **Sunken** (`muted`) are different rungs. They are not.
- **Consequence:** 21 components hover with `hover:bg-muted`, 9 with `hover:bg-accent`
  (`01-class-histogram.md`), Button `secondary` fills with `secondary`, Slider's rail is `muted`. Nothing
  looks wrong today _only because_ the values coincide; the first person who retunes one token breaks
  the visual consistency of 30 components at once.
- **Options:** (a) keep one value, declare `secondary`/`accent` aliases of `muted` in the token source and
  the doctrine, and lint one hover token (`accent`, as `design.md` already says); (b) give the rungs real,
  different values (e.g. `secondary` one step lighter than `muted`) and audit every use.
  **Recommend (a)** — the Vercel/Linear look has no visible "subtle vs sunken" distinction; the
  distinction is a hover _state_, not a surface.

### B1-03 · HIGH · bloat · Button ships 15 variants; seven are colour theatre with zero consumers

- **Where:** `button.tsx:36-50` — `success`, `warning`, `info`, and the four `{family}-outline` tints.
- **Evidence:** outside Button's own preview/playground, the only uses are the IconButton and
  SplitButton previews that mirror them. No component and no block uses one. The rendered variants row
  (`captures/button/buttonVariants__1280-light-ltr.png`) reads as a rainbow, against `design.md`'s "colour is
  rationed and meaningful" and "keep blue out of action clusters".
- **Fix:** delete the seven. Core set becomes `default · secondary · outline · ghost · link ·
destructive` (+ `cta` marketing, + `glass` **only** if the media players keep it — decided in Batch 4).
  Status-coloured _actions_ are an Alert/Banner concern (an action inside an Alert inherits the tint from
  the Alert). Update IconButton/SplitButton previews and playgrounds, `component-contracts.json`, docs.

### B1-04 · MEDIUM · doctrine · Retire `shadow-lit` / Button `finish` (decided 2026-09-07)

- **Where:** `button.tsx:86-93,129-135,183`, token `--shadow-lit` (light + dark), `design.md` §Elevation,
  `button.mdx` "Lit finish" section (which also breaks the fixed section order by sitting after Do/Don't),
  `pricing-section.mdx` (uses `finish="lit"`), `button.test.tsx`.
- **Fix:** remove prop, compound variant, `data-finish`, token, docs section, lint allowlist; doctrine
  becomes "exactly one shadow role: `shadow-overlay`".

### B1-05 · MEDIUM · API · The size vocabulary says `default` where the tokens say `md`

- **Where:** 31 files use `size="default"` (list in the register); tokens are `--size-xs/sm/md/lg`.
  Checkbox/Radio are `sm|default`, Switch `sm|default|lg`, Input `sm|default|lg`, Button
  `xs|sm|default|lg|icon|icon-xs|icon-sm|icon-lg`.
- **Fix (breaking, allowed):** rename `default → md` everywhere; Button's icon tiers fold into
  `IconButton` (`xs|sm|md|lg`) and Button drops `icon*` sizes entirely (IconButton is the only sanctioned
  icon-only path anyway — it exists for the compile-time `aria-label`). One vocabulary: `xs|sm|md|lg`.

### B1-06 · MEDIUM · consistency · Form labels are 12px; the doctrine says 14px

- **Where:** `label.tsx:54`, `field.tsx:82` use `text-label-sm` (12/500). `design.md` §Typography:
  "`text-label` (14/500) for UI labels, nav, **form labels**; `text-label-sm` (12/500) for table headers,
  eyebrows, dense metadata." Measured 12px in `captures/field/record.json`.
- **Visual:** at 1280 the 12px label over a 14px input reads under-weighted
  (`captures/field/fieldStates__1280-light-ltr.png`). Vercel Geist labels are 13–14px; Linear 13px.
- **Fix:** `text-label` on Label/FieldLabel/FieldLegend; keep `text-label-sm` for `labelAction` and
  table headers. Or amend the doctrine to 12px — **MK decision (Doubt D3)**.

### B1-07 · MEDIUM · UX · Helper text sits _above_ the control

- **Where:** `field.tsx:442-445` — vertical orientation renders `FieldDescription` between label and
  control. Geist, Linear, Raycast, Apple HIG and Material all place helper text _below_ the control, and
  errors replace/extend it there. Above-the-control text pushes every input down and separates it from its
  label when the description wraps.
- **Fix:** description below the control (before error/success); keep `labelAction` on the label row.
  **Doubt D4** if MK prefers the current placement.

### B1-08 · MEDIUM · UX · Button loading shifts width

- **Where:** `button.tsx:192-193` — text sizes _prepend_ a spinner; the button grows by
  `spinner + gap` when `loading` flips, so a "Save changes" button jumps ~20px.
- **Fix:** stack the spinner over the label (`grid [&>*]:col-start-1 [&>*]:row-start-1`; label
  `invisible` while loading) so width is stable; keep `aria-busy`. Add a test asserting width is unchanged
  across the flip.

### B1-09 · MEDIUM · UX · Disabled buttons cannot explain themselves

- **Where:** `button.tsx:21` `disabled:pointer-events-none`. A disabled control that swallows pointer
  events cannot show a tooltip ("You need the Admin role"), the single most common enterprise UX ask.
- **Fix:** drop `pointer-events-none` (Base UI already suppresses activation on disabled) and keep
  `cursor-not-allowed`; document `focusableWhenDisabled` + Tooltip as the pattern. Applies to Checkbox,
  Radio, Input group (`has-disabled:pointer-events-none`) — decide once.

### B1-10 · MEDIUM · consistency · Only `default` has an `active:` step

- **Where:** `button.tsx:26` vs 27-50. `design.md` §Components: "States (every button) — default · hover
  · focus · active · disabled · loading". Secondary/outline/ghost/soft/link have no pressed state.
- **Fix:** add `active:` for each kept variant using the existing `-active`/`--alpha-ink-tint-strong`
  roles.

### B1-11 · MEDIUM · bloat · The field chrome is copy-pasted three times

- **Where:** `input.tsx:81-105` (`fieldClasses`, `groupClasses`, `addonClasses`), duplicated verbatim in
  `number-field.tsx:117-132` and `textarea.tsx:42-49`; `field.tsx:340-344` restates it a fourth time as
  slot-targeted overrides. Combobox/ChipInput/TextEdit are checked in Batch 3/4.
- **Fix:** one `field-chrome` source (a `cva` in `input.tsx`, exported) that Input, Textarea, NumberField,
  Combobox input-group, ChipInput and TextEdit consume; Field's `borderless` targets a single
  `data-slot^="field"`-agnostic hook (`data-borderless` on the root, `group-data-borderless:` on the chrome)
  instead of enumerating slots.

### B1-12 · MEDIUM · consistency · Invalid-shake is wired per component

- **Where:** Input, Checkbox, RadioGroupItem, OTPInput, NumberField each carry ~35 lines of the same
  `useShakeOnInvalid` + `mergeRefs` + `onAnimationEnd` plumbing; Textarea has none (so the two text-entry
  siblings disagree); Switch opts out by decision; Slider has no invalid concept.
- **Fix options:** (a) move the observer into `Field` (one MutationObserver on the field root, shaking
  the control it wraps) and delete the per-control plumbing — controls get simpler and Textarea gains the
  behaviour for free; (b) add it to Textarea and accept the duplication. **Recommend (a)**; standalone
  `<Input aria-invalid>` keeps a one-line opt-in. **Doubt D5.**

### B1-13 · LOW · a11y/UX · `selection:bg-primary` overrides native text selection

- **Where:** `input.tsx:86,191`, `otp-input.tsx:139`, `number-field.tsx:230`. Selected text becomes
  near-black with white text in light; in dark, near-white with black text. Native selection is what users
  expect and it respects OS/accessibility settings. **Doubt D6** — recommend removing.

### B1-14 · LOW · API · `Label` is `flex`, so it cannot be used inline

- **Where:** `label.tsx:54`. `inline-flex` keeps the icon-gap behaviour and stops a Label inside a
  sentence from breaking the line.

### B1-15 · LOW · feature gap · Slider has no value readout or marks

- **Where:** `slider.tsx`. Every benchmark slider shows the value while dragging/focused (Linear, Radix
  Themes, Geist) and supports tick marks for stepped ranges. Base UI exposes `Slider.Value`; not composed.
- **Fix:** optional `showValue` (renders `Slider.Value` in a small floating label above the active thumb
  on drag/focus, `motion-pop-in`) and `marks` (aria-hidden ticks at step multiples). **Motion register M-05.**

### B1-16 · LOW · gap · No `CheckboxGroup`

- Base UI ships a `CheckboxGroup` (parent/child indeterminate, `allValues`). The system has none, so the
  "select all" pattern in DataGrid/DataList is hand-rolled. Candidate addition, decided with the deps
  report (`01-deps.md`).

### B1-17 · LOW · docs · Section-order and coverage nits

- `button.mdx`: "Lit finish" after Do/Don't (goes away with B1-04). `number-field.mdx`: "Scope" between
  Usage and Examples — fold into Usage. `textarea.mdx` shows no `size` example; `number-field.mdx` has
  only two previews (no disabled/invalid/sizes fixture, so the contract suite never sees those states).
- `checkbox.mdx` preview labels (`sm`/`default`) render in mono at 12px — fine, but they will need the
  `md` rename (B1-05).

### B1-18 · LOW · tests · Gaps the batch's otherwise strong suites leave

- No test exercises forced colours anywhere (the class of B1-01). No test asserts Button's width across
  the `loading` flip (B1-08). Textarea has no `size` assertion. Slider has no RTL keyboard test
  (ArrowLeft should _increase_ in RTL — Base UI handles it, but nothing proves it).

### Verified fine (so nobody re-audits it)

Hit areas ≥24px on checkbox/radio/switch/slider — proven by element-from-point tests; no axe violations
in any lane; no horizontal overflow at 320 in any fixture; RTL mirrors the switch thumb and number-field
steppers correctly; radio/checkbox `dark:bg-input/(--alpha-input)` wash reads correctly on dark; OTP
paste/autofill semantics delegated to Base UI; NumberField currency formatting is `Intl`, not a
component; Field's `responsive` orientation is a container query, not JS; `Textarea` stays server-safe.

## Motion register — Batch 1 (existing, nothing added)

| id   | where                         | motion                                        | verdict                    |
| ---- | ----------------------------- | --------------------------------------------- | -------------------------- |
| M-01 | Input/Checkbox/Radio/OTP/NF   | `motion-shake` on invalid transition          | keep (functional)          |
| M-02 | RadioGroupItem indicator      | scale 0→1, 150ms standard                     | keep                       |
| M-03 | Switch thumb                  | translate, 150ms standard                     | keep                       |
| M-04 | Slider thumb                  | scale 1.1 while dragging, 150ms               | keep                       |
| M-05 | Slider value label (proposed) | `motion-pop-in` on drag/focus                 | **MK to approve** (B1-15)  |
| —    | Button                        | none (colour changes immediate, per doctrine) | keep; loading spinner only |

## Doubts for MK (Batch 1) — decided 2026-09-07

| id  | question                                   | decision                                                                                                                                                                                                                                                 |
| --- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | `secondary`/`muted`/`accent` are one value | **Study first.** MK asked for a scenario-by-scenario examination against our palette and the reference palettes (Geist, Radix/shadcn, Linear, Raycast, plus vercel.com/design.md), then a proposal. → `03-proposals.md` §P1                              |
| D2  | Button variant deletion                    | **Conditional.** MK asked (1) how a status-coloured action (e.g. a success button) is still expressible after deletion and (2) that every existing usage be migrated as part of the same change. → `03-proposals.md` §P2 (`tone` axis + migration table) |
| D3  | Form label size                            | **12px stays; amend `design.md`** so "form labels" move to `text-label-sm`. B1-06 becomes a doctrine edit, not a code edit.                                                                                                                              |
| D4  | Helper text position                       | **Below the control.** B1-07 stands.                                                                                                                                                                                                                     |
| D5  | Where invalid-shake lives                  | **`Field` owns it.** B1-12 option (a).                                                                                                                                                                                                                   |
| D6  | Native text selection in fields            | **Remove `selection:*`.** B1-13 stands.                                                                                                                                                                                                                  |
| D7  | Disabled controls and pointer events       | **Drop `pointer-events-none`, allow tooltips.** B1-09 stands, applied uniformly.                                                                                                                                                                         |

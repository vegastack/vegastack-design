# Migrating to VegaStack Design 1.0

**1.0 rebuilds the system on shadcn `base-nova`, used as-is.** Every component shadcn ships is now
upstream's own file plus a small, recorded patch, so its props, its variants and its behaviour are
upstream's. What VegaStack adds on top is sixty recorded exceptions — the focus outline with no glow,
the hand cursor, an accessibility set, four status families, our chart and tag palettes, and our own
motion utilities — and nothing else.

**There is no compatibility layer.** No aliases, no deprecation shims, no re-exported old names, no
codemod. A retired import fails to resolve; a deleted token silently compiles to nothing, which is
the worse half, because the page keeps rendering and just looks wrong. Both are findable
mechanically — see § 11.

This is a one-time break. Read § 1 for what you will see change, then work §§ 3–9 against your own
code.

## Contents

1. [What you will see change](#1-what-you-will-see-change)
2. [Upgrade order](#2-upgrade-order)
3. [Token renames and deletions](#3-token-renames-and-deletions)
4. [Typography](#4-typography)
5. [Status colour now has two inks](#5-status-colour-now-has-two-inks)
6. [`@vegastack/design` exports that were removed](#6-vegastackdesign-exports-that-were-removed)
7. [Retired components, with prop maps](#7-retired-components-with-prop-maps)
8. [Removed outright: the marketing layer](#8-removed-outright-the-marketing-layer)
9. [API changes, component by component](#9-api-changes-component-by-component)
10. [New in 1.0](#10-new-in-10)
11. [Finding every holdover](#11-finding-every-holdover)

---

## 1. What you will see change

These are visual and behavioural, not API, and they land the moment you update the token layer. They
are the point of the release, not side effects.

| Before (0.x)                                                                | After (1.0)                                                                                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A soft 3px `ring-ring/50` glow around a focused control                     | One crisp 2px `:focus-visible` outline in the near-black / near-white ink. Text entry tints its border instead |
| An arrow cursor on buttons; an explicit `cursor-default` on menu rows       | A hand cursor on every control, menu rows included                                                             |
| A warm neutral ramp (OKLCH hue 75)                                          | shadcn's own `neutral` — pure achromatic. Light `background` is white, not 0.994                               |
| A three-rung surface ladder (`surface-1/2/3`) driving every hover and press | `muted` for a well or track, `accent` for a hover; each component writes its own hover and press               |
| Every control had a pressed step, enforced by lint                          | A hover with no pressed step is upstream's own behaviour and is fine                                           |
| Radius capped at `rounded-lg`; `rounded-xl` banned                          | Radius derives from one `--radius` (0.625rem); a card and a dialog wear `rounded-xl`                           |
| One sanctioned shadow (`--shadow-overlay`), everything else flat            | `shadow-sm` / `shadow-md` / `shadow-lg`, per component, as shadcn uses them                                    |
| 14px product type scale, weight ladder 400/500                              | Tailwind's stock scale. `text-sm` is 14px, `text-base` is 16px. `font-semibold` is ordinary                    |
| Colour transitions banned (`transition-colors` was a lint error)            | `transition-all duration-100 ease-in-out` is upstream's vocabulary and is legal                                |
| Three named z-bands (`--z-raised/overlay/toast`)                            | `z-50` and DOM order. **A toast raised from inside a modal now sits behind the scrim** — upstream's behaviour  |
| A solid destructive Button was forbidden; `destructive` was a tone          | `variant="destructive"` is a soft tint (`bg-destructive/10`) — visually close, but it is now a variant         |
| `Sheet` ran on Base UI **Drawer** (swipe, snap points)                      | `Sheet` is Base UI **Dialog** with `side` on the content; the gesture work moved to the new `Drawer`           |
| Tabs' default list was the underline                                        | Tabs' default list is upstream's grey pill track; `line` is the alternative                                    |
| Table body cells wrapped                                                    | Every cell is `whitespace-nowrap`; a wide table scrolls in a plain container                                   |

Two of those deserve a second sentence, because they can look like regressions:

- **The table scroll container is not a keyboard tab stop.** Upstream's `Table` wraps itself in a
  plain overflow div. If a table of yours is genuinely wide, give the wrapper a `tabIndex={0}` and an
  `aria-label` in your own code. This is a known, recorded gap.
- **A toast fired from inside an open dialog renders behind the scrim.** There is one `z-50` band and
  DOM order decides; the `<Toaster />` mounts first. Raise the toast after the dialog closes, or
  mount your toaster after it.

## 2. Upgrade order

Do it in this order — each step makes the next one's failures legible instead of mysterious.

1. **Update the packages.** `@vegastack/design` and `@vegastack/design-tokens` to `1.0.0`.
2. **Build and read the type errors.** Every retired import and every removed prop is a type error.
   Work § 7 and § 9 until it compiles.
3. **Run the two searches in § 11.** They find the deleted tokens and utilities, which the compiler
   cannot see.
4. **Re-pull your copied-in components.** `vegastack-design check-updates`, then
   `shadcn add @vegastack/<name> --diff` on each one you want to read, then `--overwrite`. Every
   component's file changed in 1.0. If you edited a copied-in file, move that change into a wrapper or
   a token override first — `--overwrite` destroys it.
5. **Look at the result in both themes.** § 1 is what you should see; anything else is worth reporting.

## 3. Token renames and deletions

Nothing was renamed in place. Families were **deleted**, and the thing they expressed is now a plain
Tailwind utility.

| Deleted                                                                   | Write instead                                                          |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `--surface-1` / `--surface-2` / `--surface-3`                             | `bg-muted` (rest, well, track) · `bg-accent` (hover, pressed)          |
| `--surface-raised`                                                        | `bg-card` or `bg-background`, depending on the ground                  |
| every `--alpha-*` (the 22-entry ladder)                                   | the literal percentage: `bg-foreground/10`, `border-border/50`         |
| every `--opacity-*`                                                       | the literal step: `opacity-50`                                         |
| `--size-xs/sm/md/lg`                                                      | `h-6` · `h-7` · `h-8` · `h-9`                                          |
| `--icon-*`                                                                | `size-3` · `size-3.5` · `size-4`                                       |
| `--panel-width-*`, `--layout-*`                                           | a width utility (`w-72`) or your own layout                            |
| `--z-raised` / `--z-overlay` / `--z-toast`                                | `z-10` · `z-50`                                                        |
| `--shadow-overlay`                                                        | `shadow-md` (a popover) · `shadow-lg` (a modal)                        |
| `--radius-xs` / `--radius-sharp`                                          | `rounded-sm` · (nothing — the sharp gesture was marketing)             |
| `--overlay`                                                               | upstream's scrim, `bg-black/10` — you get it from `DialogOverlay`      |
| `--muted-foreground-faint`                                                | `text-muted-foreground` (placeholders use it now)                      |
| `--font-family-pixel`, `--motion-blur`, `--effect-blur-glass`             | nothing; they went with the marketing layer                            |
| `<family>-subtle` / `-subtle-hover` / `-subtle-active`                    | the family at an alpha: `bg-destructive/10`, `hover:bg-destructive/20` |
| `<family>-hover` / `<family>-active` / `primary-hover` / `primary-active` | the fill at an alpha: `hover:bg-primary/80`                            |
| `<family>-border`                                                         | `border-destructive` (upstream tints the border with the fill)         |

**Kept, and still ours:** `--brand` / `--brand-text`, the ten `--tag-*` trios, `--chart-1…8` and
`--chart-single`, `--media-scrim` / `--media-scrim-strong` / `--media-foreground`, the
`--duration-*` / `--motion-ease-*` pairs behind the `motion-*` utilities, and the Geist font
families. **Kept and expanded:** the `info` / `success` / `warning` families, now written in
upstream's own `destructive` shape.

## 4. Typography

The role utilities and the 14px product scale are gone. Tailwind's stock scale is the scale, so
`text-sm` is 14px and `text-base` is 16px.

| Deleted utility                                | Write instead            |
| ---------------------------------------------- | ------------------------ |
| `text-h1`                                      | `text-3xl font-semibold` |
| `text-h2`                                      | `text-2xl font-semibold` |
| `text-h3`                                      | `text-xl font-semibold`  |
| `text-h4`                                      | `text-base font-medium`  |
| `text-label`                                   | `text-sm font-medium`    |
| `text-label-sm`                                | `text-xs font-medium`    |
| `text-code`                                    | `font-mono text-sm`      |
| `text-code-sm`                                 | `font-mono text-xs`      |
| `text-mono-label`                              | `font-mono text-xs`      |
| `text-display-sm` … `text-display-xl`          | `text-4xl` … `text-7xl`  |
| `text-base` (when you meant the old 14px body) | `text-sm`                |

Three bans went with them, and all three are now ordinary: `font-semibold` and `font-bold`, a raw
`tracking-*`, and `text-4xl` and above. Uppercase is no longer mono-exclusive.

Rendered rich text is unchanged: `proseClassName` from `@vegastack/design` is still the one recipe,
and `MarkdownView` and `TextEdit` still wear it.

## 5. Status colour now has two inks

This is the one addition most likely to bite, because the wrong choice still renders.

- **`--<family>-foreground`** is the ink **on the solid fill**: `bg-destructive text-destructive-foreground`.
- **`--<family>-text`** is the ink **on the page, and on the family's own `/10`–`/30` tint**:
  `bg-destructive/10 text-destructive-text`.

Using the fill itself as ink on its own tint — `bg-destructive/10 text-destructive`, which is what
upstream writes — measures **3.99:1** in light, under the AA floor. The `-text` half reads 6.97:1 on
the same composite. `destructive-text`, `info-text`, `success-text` and `warning-text` all exist for
exactly this, and `brand-text` is the same role for the brand accent.

`info` stays rationed to links and informational UI. A status hue means status, not sentiment: a
favourite star is `text-foreground`, not `text-warning`.

## 6. `@vegastack/design` exports that were removed

Each was a shared class-string recipe for a system that no longer exists. There is no alias; replace
each with the literal it expanded to, written the way the component beside it writes its own chrome.

| Removed                   | What it was                              | Replace with                                                                     |
| ------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------- |
| `surfaceInteractive`      | `hover:bg-surface-2 active:bg-surface-3` | `hover:bg-accent hover:text-accent-foreground`                                   |
| `surfaceInteractiveGroup` | the same, keyed off a group              | the `group-hover:` form of the above                                             |
| `fillInteractive`         | a per-tone hover/press map               | the fill at an alpha: `bg-primary hover:bg-primary/80`                           |
| `FillTone`                | its tone union                           | (nothing — the tone axis is gone)                                                |
| `fieldControl`            | the shared text-entry chrome             | compose upstream's `Input` / `Textarea` / `InputGroup` instead of re-deriving it |
| `fieldControlGroup`       | its wrapper twin                         | `InputGroup`                                                                     |
| `selectedChipVariants`    | the raised-chip-on-a-track recipe        | upstream's `TabsTrigger` / `ToggleGroupItem` chrome                              |

**Unchanged and still exported:** `cn`, `TIMINGS`, `FLOATING`, `mergeRefs`, `prose` /
`proseClassName` / `ProseElement`, the icon runtime (`Icon`, `BrandIcon`, `createAnimatedIcon`), the
Tailwind preset and the `vegastack-design` CLI. `cn` is plain `twMerge` again, because the custom
font-size class group it extended no longer exists.

## 7. Retired components, with prop maps

Ten components were deleted in favour of something upstream already does. Each row states what did
**not** survive, because in several cases something real did.

### 7.1 `IconButton` → `Button` at an icon size

| `IconButton`                                                              | `Button`                                                   |
| ------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `size="xs"`                                                               | `size="icon-xs"` (24px)                                    |
| `size="sm"`                                                               | `size="icon-sm"` (28px)                                    |
| `size="md"`                                                               | `size="icon"` (32px, the default)                          |
| `size="lg"`                                                               | `size="icon-lg"` (36px)                                    |
| `shape="round"`                                                           | `className="rounded-full"`                                 |
| `shape="square"`                                                          | the default — drop it                                      |
| `iconButtonGeometry(size, shape)`                                         | `buttonVariants({ size: "icon-sm" })`, plus `rounded-full` |
| everything else (`variant`, `loading`, `disabled`, `render`, `data-slot`) | unchanged                                                  |

```tsx
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

<Button variant="outline" size="icon-sm" aria-label="Add item">
  <PlusIcon />
</Button>;
```

**What did not survive:** the **compile-time** accessible-name guarantee. `IconButton` made a missing
`aria-label` a type error; `<Button size="icon">` without one is a valid TypeScript program. The
invariant is still enforced in this repo's lint, but in your code it is on you. A rendered control's
`data-slot` changes from `icon-button` to `button`, and `data-shape` is gone.

### 7.2 `OTPInput` → `InputOTP`

Ours was Base UI's `OTPField` with one focusable `<input>` per slot. Upstream's is the `input-otp`
package: one hidden input behind presentational slots, which is what makes paste, autofill and the
platform SMS suggestion work.

| `OTPInput`                  | `InputOTP` composition                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `length={6}`                | `maxLength={6}`                                                                                 |
| `groups={[3, 3]}`           | two `<InputOTPGroup>`s with an `<InputOTPSeparator />` between                                  |
| `separator={<Dot />}`       | the children of `<InputOTPSeparator>` (default is a minus glyph)                                |
| `separatorClassName`        | `className` on `<InputOTPSeparator>`                                                            |
| `slotClassName`             | `className` on each `<InputOTPSlot>`                                                            |
| `size="sm" \| "md" \| "lg"` | **gone** — a slot is `size-8`; override with `className` on the slot                            |
| `value` / `defaultValue`    | same                                                                                            |
| `onValueChange(v, details)` | `onChange(v)` — there is no Base UI event-details object                                        |
| `onValueComplete(v)`        | `onComplete(v)`                                                                                 |
| `aria-invalid`              | put it on `<InputOTP>`; the slot reads `not-data-[active=true]:aria-invalid:border-destructive` |

```tsx
<InputOTP maxLength={6} onComplete={verify} aria-label="Verification code">
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>
```

**What did not survive:** the three slot size tiers, and the per-slot `Character N of M` labels —
upstream has one input, so the field has one accessible name and nothing to enumerate.

### 7.3 `PasswordInput` → an `InputGroup` composition

| `PasswordInput`             | `InputGroup` composition                                   |
| --------------------------- | ---------------------------------------------------------- |
| `value` / `onChange`        | on `<InputGroupInput>`                                     |
| `revealLabel` / `hideLabel` | `aria-label` on the toggle `Button`, swapped on `visible`  |
| `defaultVisible`            | your own `useState`                                        |
| `requirements={[…]}`        | your own list under the field (each row is text + an icon) |
| `strength`                  | **gone** — compose `Progress` if you want a meter          |

```tsx
"use client";
import * as React from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

function PasswordField() {
  const [visible, setVisible] = React.useState(false);
  return (
    <InputGroup>
      <InputGroupInput
        type={visible ? "text" : "password"}
        aria-label="Password"
        autoComplete="current-password"
      />
      <InputGroupAddon align="inline-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      </InputGroupAddon>
    </InputGroup>
  );
}
```

**What did not survive:** the built-in requirements checklist and its live announcements.

### 7.4 `CheckboxGroup` → `FieldSet` + `Checkbox`

| `CheckboxGroup`                     | Upstream composition                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------------- |
| `value` / `defaultValue`            | your own `useState<string[]>`                                                      |
| `onValueChange(next)`               | per-`Checkbox` `onCheckedChange`, folded into that state                           |
| `allValues={[…]}` + parent checkbox | one `Checkbox` whose `checked` is `"indeterminate"` when the set is mixed          |
| `<Checkbox value="x" />` children   | `<Field orientation="horizontal">` rows, each with a `Checkbox` and a `FieldLabel` |
| `aria-label` on the group           | `<FieldLegend>` inside `<FieldSet>`                                                |

```tsx
<FieldSet>
  <FieldLegend>Notifications</FieldLegend>
  <FieldGroup data-slot="checkbox-group">
    <Field orientation="horizontal">
      <Checkbox
        id="email"
        checked={picked.includes("email")}
        onCheckedChange={(on) => toggle("email", on)}
      />
      <FieldLabel htmlFor="email">Email</FieldLabel>
    </Field>
    {/* …one Field per option */}
  </FieldGroup>
</FieldSet>
```

`data-slot="checkbox-group"` survives as upstream's **own** slot name on `FieldGroup` — it is what
tightens the group's gap, not a reference to the retired component.

**What did not survive:** the select-all arithmetic. It is about ten lines of your own state
(`picked.length === all.length ? true : picked.length ? "indeterminate" : false`).

### 7.5 `FieldInline` → `EditableCell`

`FieldInline` was a click-to-edit text field, not a layout prop, so it maps onto `EditableCell` —
which does the same job and more — rather than onto upstream's `Field` `orientation`.

| `FieldInline`                    | `EditableCell`                                                                                  |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `value`                          | `value`                                                                                         |
| `onCommit(next)`                 | `onCommit(next)` — may now return a promise, which engages the saving / saved / error indicator |
| `placeholder`                    | `editor={{ type: "text", placeholder }}`                                                        |
| `label`                          | `label`                                                                                         |
| `aria-label` / `aria-labelledby` | `label` (the cell resolves `label` → `placeholder` → a generic fallback)                        |
| `editing` / `onEditingChange`    | `editing` / `onEditingChange`                                                                   |
| `disabled` / `readOnly`          | same                                                                                            |
| `tabIndex={-1}` for a grid host  | `focusMode="managed"`                                                                           |
| `ref`                            | `ref` — the cell's root `<span>`, not the swapping display/edit host                            |
| `data-slot="field-inline"`       | `data-slot="editable-cell-display"` idle, `"editable-cell-input"` editing                       |
| `error`                          | **gone** — wrap the cell in `Field` and render `FieldError`                                     |
| `borderless`                     | **gone** — pass the flattening classes yourself                                                 |

For a bespoke editor, `useInlineEdit` + upstream `Input` is exactly what the cell runs internally.

**What did not survive:** `error` (the invalid tint plus the `role="status"` message) and
`borderless` (the seamless in-place title variant).

### 7.6 `Segmented` → a joined `ToggleGroup`

| `Segmented`                   | `ToggleGroup`                                                |
| ----------------------------- | ------------------------------------------------------------ |
| `value: string`               | `value: string[]` — pass `[value]`                           |
| `onValueChange(next: string)` | `onValueChange(next: string[])` — read `next[0]`             |
| (always exactly one selected) | **not enforced** — ignore an empty `next` to keep one active |
| `size="sm" \| "md" \| "lg"`   | `size` on the group (`sm` / `default` / `lg`)                |
| (joined track, always)        | `spacing={0}`                                                |
| `<SegmentedItem value>`       | `<ToggleGroupItem value>`                                    |
| (vertical: not supported)     | `orientation="vertical"`                                     |

```tsx
<ToggleGroup
  value={[view]}
  onValueChange={(next) => {
    const [selected] = next;
    if (selected) setView(selected);
  }}
  variant="outline"
  spacing={0}
  aria-label="View"
>
  <ToggleGroupItem value="list">List</ToggleGroupItem>
  <ToggleGroupItem value="board">Board</ToggleGroupItem>
</ToggleGroup>
```

**What did not survive:** the "always one selected" invariant, which is now the three-line guard
above, and the raised-chip-on-a-track look.

### 7.7 `SplitButton` → a `ButtonGroup` composition

| `SplitButton`                      | `ButtonGroup` composition                         |
| ---------------------------------- | ------------------------------------------------- |
| `children` (the default label)     | the first `<Button>`                              |
| `onClick`                          | that Button's `onClick`                           |
| `actions={[{ label, onSelect }]}`  | `<DropdownMenuItem>` children                     |
| `menuLabel`                        | `aria-label` on the trigger Button                |
| `variant` / `disabled` / `loading` | on each Button (set them on both halves to match) |

```tsx
<ButtonGroup>
  <Button onClick={save}>Save</Button>
  <DropdownMenu>
    <DropdownMenuTrigger
      render={
        <Button variant="default" size="icon" aria-label="More save options" />
      }
    >
      <ChevronDownIcon />
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem onClick={saveAndClose}>Save and close</DropdownMenuItem>
      <DropdownMenuItem onClick={saveAsDraft}>Save as draft</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</ButtonGroup>
```

**What did not survive:** nothing behavioural. The seam, the shared radius and the focus z-raise are
`ButtonGroup`'s. You set `variant`/`disabled` twice instead of once.

### 7.8 `ProgressIndicator` → `Progress` + `Spinner`

| `ProgressIndicator`             | Replacement                                               |
| ------------------------------- | --------------------------------------------------------- |
| `value` / `max`                 | `<Progress value={…} max={…} />` — same props             |
| `aria-label`                    | `aria-label` on `<Progress>`                              |
| `variant="inline-value"`        | `<ProgressLabel>` + `<ProgressValue>` inside `<Progress>` |
| `indeterminate`                 | `<Spinner />`                                             |
| `shape="circle" \| "squircle"`  | **gone** — there is no radial form                        |
| `segments={n}` / `segmentsFill` | **gone** — a single determinate bar                       |
| `size="xs" … "lg"`              | `className` on `<ProgressTrack>` (`h-1` is the default)   |

`Progress` reports `aria-valuenow` in the same units as `max` (steps, not a percentage), which is
better ARIA than the percentage-only form it replaces.

**What did not survive:** the radial ring, the squircle and the segmented dash bar — three visual
shapes, no behaviour.

### 7.9 `OnboardingChecklist` → the `onboarding-01` block

There is no drop-in replacement, and that is the disposition: a getting-started checklist is a screen
you copy once and then edit. `shadcn add @vegastack/onboarding-01` and own it.

| `OnboardingChecklist`                      | In the block                                                       |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `title`, `done`, `total`                   | literals in the copied page; `done` is derived from the step array |
| `collapsed` / `defaultCollapsed`           | `React.useState` in the copied component, if you want it           |
| `onCollapsedChange`                        | the same state setter                                              |
| `collapseLabel` / `expandLabel`            | the strings in the copied markup                                   |
| the determinate bar                        | `Progress`, composed directly                                      |
| `OnboardingChecklistItem` (`icon`, `done`) | a `<button>` row in the copied component                           |

**Two accessibility properties to keep when you edit the copy**, both of which the component asserted:
the collapsed pill carries visible text (title + `n/N`), so it must **not** take an `aria-label` —
that would replace the accessible name and break SC 2.5.3 Label in Name; append the action as
`sr-only` text instead. The expanded card's collapse toggle is icon-only, so there `aria-label` **is**
the whole name.

### 7.10 `FloatingSurface` — internal only

The shared portal + positioner + surface composer behind every anchored overlay. Every upstream popup
now owns its own chrome, so there is nothing to replace. If you installed it directly, delete it; the
component you were composing it into already paints its own surface.

**What did not survive:** nothing. Its one exception, the panel search row (a sticky header row with
no nested bordered input), is implemented in both places it was used.

## 8. Removed outright: the marketing layer

Ten components were deleted with no replacement, along with the `MarketingSurface` theme scope, its
`.vs-marketing` selectors, the marketing tokens (`--radius-sharp`, `--font-family-pixel`) and every
marketing lint rule:

`comparison-matrix` · `figure-frame` · `logo-row` · `marketing-surface` · `particle-field` ·
`pricing-section` · `ruled-band` · `section-header` · `testimonial` · `staggered-text-reveal`

If you were using one, its markup is yours now — copy the 0.x source out of your `components/ui/`
directory before you re-pull, because that is the only copy that will exist.

`announcement-banner`, `terminal` and `code-block` sat in the same family and were **kept**. They
moved in the docs nav (to Feedback and to Content); their APIs are unchanged.

## 9. API changes, component by component

Every component shadcn ships now has upstream's API. This lists what actually moved in code you are
likely to have written. When in doubt, the component's page at
<https://design.vegastack.com/docs/components> is the live contract.

### Button — `variant × tone` became upstream's flat `variant`

The two-axis API is gone. There is no `tone` prop, no `--btn-*` custom properties and no `cta`
variant.

| 0.x                                     | 1.0                                                                        |
| --------------------------------------- | -------------------------------------------------------------------------- |
| `variant="solid" tone="neutral"`        | `variant="default"`                                                        |
| `variant="soft" tone="neutral"`         | `variant="secondary"`                                                      |
| `variant="outline" tone="neutral"`      | `variant="outline"`                                                        |
| `variant="ghost" tone="neutral"`        | `variant="ghost"`                                                          |
| `variant="link" tone="neutral"`         | `variant="link"`                                                           |
| `variant="soft" tone="destructive"`     | `variant="destructive"` (still a soft tint, not a solid red)               |
| `tone="success" \| "warning" \| "info"` | **gone** — no Button variant carries them; use the component that means it |
| `variant="cta"`                         | **gone** with the marketing layer                                          |
| `size="xs" \| "sm" \| "md" \| "lg"`     | `size="xs" \| "sm" \| "default" \| "lg"`                                   |
| (no icon tier — that was `IconButton`)  | `size="icon" \| "icon-xs" \| "icon-sm" \| "icon-lg"`                       |
| `data-tone` / `data-shape`              | **gone**; `data-variant` and `data-size` remain                            |

`loading` survives unchanged and is still ours: it holds the label's box at `opacity-0` under the
spinner and sets `aria-busy`. Disabled still renders `aria-disabled` and keeps its pointer events, so
a tooltip can explain it.

### Badge, Alert, Toast, Field — status is a `variant`

Our four status families are now extra `variant` values in upstream's own `destructive` shape.
`Alert`'s variants are `default · destructive · success · warning · info`. `Badge` keeps its tinted
status variants the same way. Each takes the family's `-text` ink on its tint (§ 5), and each keeps
its icon, because a status is never signalled by colour alone. **Badge lost its `size` axis**
(`sm` / `md` / `lg`).

### Tabs

`variant` is `default` (upstream's grey pill track) and `line`. `pill` and `chip` are gone, as is
`TabsTrigger`'s `count` badge — compose a `Badge` inside the trigger instead. There is no `loading`
prop: a tab reveals a panel that is already mounted.

`orientation="vertical"` is a **layout** switch only — upstream writes `data-orientation` itself
rather than forwarding it, so the roving axis stays ←/→.

### Form controls

| Component        | Removed                                                              |
| ---------------- | -------------------------------------------------------------------- |
| `Input`          | `size`, `prefix`, `suffix` — compose `InputGroup` for an addon       |
| `Textarea`       | `size`                                                               |
| `Checkbox`       | `size`                                                               |
| `RadioGroupItem` | `size`                                                               |
| `Switch`         | `size`                                                               |
| `Slider`         | `variant`, `thumb`                                                   |
| `Select`         | the `md` tier (sizes are upstream's now)                             |
| `NumberField`    | `size`; the box is upstream's `InputGroup`                           |
| `ChipInput`      | `size`; `chipInputVariants` is deleted with no alias                 |
| `Combobox`       | the VegaStack input-group parts; it composes upstream's `InputGroup` |

**`Field` composes rather than configures.** `label`, `description`, `error` and `borderless` are
gone; `FieldLabel` (bound with `htmlFor`), the control, `FieldDescription` and `FieldError` are
**children**. `aria-invalid` goes on the control; `data-invalid` / `data-disabled` on the `Field`.
react-hook-form's `register` wires straight to the control — there is no `Controller` indirection.

### Overlays

| Component                                 | Change                                                                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `DialogContent`                           | `size` and `closeLabel` removed — retune with a `max-w-*` utility                                                                           |
| `SheetContent`                            | `size` removed                                                                                                                              |
| `Sheet`                                   | `side` moved from the root to `SheetContent`; the root is Base UI **Dialog** now                                                            |
| `DropdownMenuContent`                     | `portalProps` removed                                                                                                                       |
| `DropdownMenuItem` / `ContextMenuItem` /… | `tone` → `variant`                                                                                                                          |
| `Command`                                 | now **cmdk**, not a Base UI Combobox build; its parts are upstream's                                                                        |
| `Toast`                                   | `toast()` and its `.success` / `.error` / `.dismiss` helpers → `toast.add({ … })`, `toast.close(id)`, `toast.update(…)`, `toast.promise(…)` |

**`Sonner` ships alongside `Toast`.** Upstream has both; mount one, not both.

**`Drawer` is new and replaces nothing.** Upstream ships `sheet` (Dialog-based, `side`) and `drawer`
(swipe, snap points, nesting, non-modal) as two components. The swipe-and-snap behaviour 0.x's Sheet
had lives in `Drawer` now. Its snap-point props are Base UI's names — `snapPoint`,
`defaultSnapPoint`, `onSnapPointChange` — not Vaul's `activeSnapPoint`.

### Navigation and layout

| Component                                   | Change                                                                              |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| `AppShell`                                  | `mobileBreakpoint` and `keyboardShortcut` removed (upstream's provider has neither) |
| `Table`                                     | `scrollLabel`, `grid`, `containerProps` removed; cells no longer wrap               |
| `Progress`                                  | `size`, `trackClassName`, `indicatorClassName` removed; five parts now              |
| `ScrollArea`                                | `orientation` and `scrollbarProps` removed; export `ScrollBar` for a second axis    |
| `Breadcrumb`                                | `BreadcrumbTrail` removed — compose the parts                                       |
| `Pagination`                                | `PaginationPager` removed; `size` removed                                           |
| `NavigationMenu`                            | `NavigationMenuPanel` removed — upstream's parts                                    |
| `Avatar`, `Kbd`, `Empty`, `Spinner`, `Card` | `size` removed (`Card` keeps one, renamed `md` → `default`)                         |

### Data and AI/chat

| Component                     | Change                                                                                                                                                                                                                                                                                               |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Attachment`                  | states are upstream's `idle · uploading · processing · error · done` — no `complete`, no `disabled`; `AttachmentProgress` and `AttachmentDescription`'s `live` removed; the `md` tier removed; gains `xs` and an `AttachmentAction` part                                                             |
| `Bubble`, `Message`, `Marker` | `animateIn` removed — a thread's entrance animation is the app's                                                                                                                                                                                                                                     |
| `Chart`                       | `ChartGrid` removed (use recharts' own `CartesianGrid`); `ChartColorToken` removed — `ChartConfig` takes any colour string; `ChartStyle` is exported                                                                                                                                                 |
| every reset component         | the `<Name>Props` type aliases upstream does not export were dropped                                                                                                                                                                                                                                 |
| `MediaPlayerControls`         | `portalContainer` removed — upstream's `TooltipContent` and `DropdownMenuContent` forward no container, so a player in fullscreen shows no control tooltip and no settings menu. Every control keeps its `aria-label`, its icon and its keyboard shortcut, and the volume panel is inline. Known gap |

## 10. New in 1.0

Thirteen components arrive with upstream and are worth knowing before you hand-roll one:

`aspect-ratio` · `button-group` · `calendar` · `carousel` · `direction` · `drawer` · `input-group` ·
`input-otp` · `menubar` · `native-select` · `questionnaire` · `sonner`, plus `panel-search`, which is
an internal shared row installed as a dependency rather than picked from a list.

**Blocks.** 1.0 ships 100 of them — 28 of upstream's Base UI blocks, 68 chart blocks, and four of
ours (`app-shell-01`, `board-01`, `settings-01`, `onboarding-01`). A block is copy-once: install it,
own it, and it is never updated under you. `preview` and `preview-02` are deliberately not shipped —
they are shadcn's own site scaffolding over ~58 card modules the registry does not serve.

## 11. Finding every holdover

The compiler finds retired imports and removed props. It cannot see a deleted CSS token, which
compiles to nothing and paints the inherited value, so run these two searches over your own source —
exclude `components/ui/`, which you will re-pull.

```bash
# Retired and removed component names.
rg -n 'IconButton|OTPInput|PasswordInput|CheckboxGroup|FieldInline|Segmented|SplitButton|ProgressIndicator|OnboardingChecklist|FloatingSurface|MarketingSurface|ComparisonMatrix|FigureFrame|LogoRow|ParticleField|PricingSection|RuledBand|SectionHeader|Testimonial|StaggeredTextReveal' --glob '!components/ui/**'

# Deleted tokens, utilities and exports.
rg -n 'surface-(1|2|3|raised)|--alpha-|--opacity-|--size-|--icon-|--panel-width-|--z-(raised|overlay|toast)|shadow-overlay|radius-(xs|sharp)|text-(h[1-4]|label|label-sm|code|code-sm|mono-label|display-)|muted-foreground-faint|-subtle(-hover|-active)?\b|surfaceInteractive|fillInteractive|fieldControl|selectedChipVariants' --glob '!components/ui/**'
```

The `vegastack-design-audit` agent skill runs both, plus the focus-glow and status-ink checks, and
reports them with severities. Then:

```bash
npx --package=@vegastack/design vegastack-design check-updates  # every component reads as an update
pnpm dlx shadcn@latest add @vegastack/<name> --diff             # read one before taking it
pnpm dlx shadcn@latest add @vegastack/<name> --overwrite        # take it
```

---

**Why this happened.** The system began as shadcn and drifted: 168 deliberate deviations accumulated,
each defensible alone, and together they made components that read as worse than the upstream they
came from. 1.0 reverses the accumulation rather than continuing to patch it. The complete decision
register — 170 rows, 110 resolved as shadcn and 60 kept as ours — is
`docs/plans/2026-09-18-shadcn-reset/decisions.md`, with its machine copy at
`packages/ui/upstream/decisions.json`. Every component's docs page ends in a `## Deviations` section
naming the decision IDs behind its own patch, so any single difference from shadcn is traceable in
one click.

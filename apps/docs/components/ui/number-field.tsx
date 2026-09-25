// @vegastack number-field@0.23.21 sha256-MVDJEKZC9ktku3hUmjY/xqvKQ6esKrt+/hkh8wBX44k=

"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { cn } from "@vegastack/design";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

/* ---
`NumberField` exists because the roster has no numeric input otherwise: quantities, limits,
percentages and money would all be typed into a text `Input` with hand-rolled parsing.
Base UI's NumberField supplies the hard parts — locale-aware parsing/formatting
(`format: Intl.NumberFormatOptions` + `locale`), min/max/step with snap, keyboard
stepping, wheel scrub — and everything this file renders is upstream's:
`InputGroup` is the bordered box (border, focus border, invalid, disabled, dark wash),
`InputGroupInput` is upstream `Input` flattened into it, and each stepper is an
`InputGroupButton`, which is upstream `Button`. Nothing here restates a class string
one of those already owns.

FRM-13 is the one exception and it is a LAYOUT, not a recipe: the steppers FLANK the
field at full height instead of stacking as half-height spinners, so each pointer target
is ≥24×32 without a hit-area expansion — which stacked spinners cannot manage inside a
32px control. The wash and the ink step are the ghost Button's own.

Money is a format prop, not a component: pass
`format={{ style: "currency", currency: "INR" }}`. A CRM-specific `money-input` in a
general design system is the wrong shape (scope call S4). Minor-units conversion (cents
in the API, display units here) belongs at the app's field layer — documented on the
docs page, deliberately not built in.

Deliberately NOT done here:
- No `ScrubArea`. Pointer-scrubbing on a label is a power affordance with no keyboard
  or touch equivalent; consumers who want it compose `BaseNumberField.ScrubArea`
  directly inside a custom `prefix`.
- No control-height scale. Upstream deleted the 28/32/40 `size` prop from `Input`,
  `Textarea`, `Select` and the rest in Batch 3 of the shadcn reset, and this control
  does not get to be the one that keeps it. The box is `InputGroup`'s; a caller who
  needs another height passes a height class in `className`.
- No re-exposed `Group` part. The root IS the `InputGroup` here; splitting parts would
  only invite layouts the chrome cannot honour.
--- */

/** Props accepted by `NumberField`. */
export interface NumberFieldProps extends Omit<
  React.ComponentProps<typeof BaseNumberField.Root>,
  "className" | "prefix"
> {
  /**
   * Accessible name for the numeric input. Required in practice unless a
   * wrapping `Field`/`aria-labelledby` supplies one — the input must never be
   * unnamed.

   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Marks the value invalid. It lands on the inner `<input>` — never the group — and upstream's
   * `InputGroup` paints its invalid hairline from that descendant.

   * @default undefined
   */
  "aria-invalid"?: React.AriaAttributes["aria-invalid"];
  /**
   * Ids of the elements that describe the value — an error or a hint. They land on the inner
   * `<input>`, which is what a screen reader announces, never on the group. Inside a `Field` the
   * rendered `FieldDescription`/`FieldError` ids are added for you.

   * @default undefined
   */
  "aria-describedby"?: string;
  /**
   * Ids of the elements that name the value. Lands on the inner `<input>`, like `aria-label`.
   * `id` (inherited from Base UI's root) already targets the input.

   * @default undefined
   */
  "aria-labelledby"?: string;
  /**
   * Placeholder for the empty input.

   * @default undefined
   */
  placeholder?: string;
  /**
   * Non-editable addon before the input (a unit, an icon, a currency code),
   * rendered in an upstream `InputGroupAddon`. Plain strings read as muted,
   * non-selectable text.

   * @default undefined
   */
  prefix?: React.ReactNode;
  /**
   * Non-editable addon after the input. The documented seat for a currency-code
   * `Select` in the money recipe.

   * @default undefined
   */
  suffix?: React.ReactNode;
  /**
   * Hide the − / + stepper buttons. Keyboard stepping (arrows, Home/End) and
   * wheel scrub keep working — the buttons are a pointer affordance only.
   * @default false
   */
  hideControls?: boolean;
  /** Extra classes for the `InputGroup` root.
   * @default undefined
   */
  className?: string;
  /**
   * Classes for the inner `<input>` element (e.g. `text-end` for columnar
   * numbers).

   * @default undefined
   */
  inputClassName?: string;
  /**
   * Ref forwarded to the inner `<input>` element.

   * @default undefined
   */
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * FRM-13's stepper geometry, and the whole of what this file adds to upstream's button: the
 * control is the field's full height and ≥24px wide, square on the inside edge so it meets the
 * group's hairline cleanly, and it carries the negative outline offset the group's `overflow`
 * would otherwise clip (FOC-9).
 */
const stepperClasses =
  "h-auto w-7 shrink-0 self-stretch rounded-none p-0 focus-visible:-outline-offset-2 has-[>svg]:p-0";

/**
 * The addon that HOLDS a stepper, rather than a unit or an icon: it gives up its own padding and
 * the −0.3rem inset upstream applies to a button addon (that inset exists to pull a small ghost
 * control back off the box's inner edge; here the control IS the edge), and stretches so the
 * button's full height has something definite to stretch against.
 */
const stepperSlotClasses =
  "self-stretch p-0 has-[>button]:ms-0 has-[>button]:me-0";

/**
 * `NumberField` — a locale-aware numeric input on Base UI's NumberField, wearing upstream's
 * `InputGroup` chrome. Formatting is `Intl`: pass `format={{ style: "percent" }}`,
 * `{ style: "currency", currency: "EUR" }`, or unit options, plus `locale` to pin one.
 * `min`/`max`/`step` (with `snapOnStep`), keyboard stepping (arrows; <kbd>Shift</kbd> for
 * `largeStep`, <kbd>Alt</kbd> for `smallStep`), and wheel scrubbing all come from Base UI.
 *
 * Money is a recipe, not a separate component: currency `format` here, and the
 * app's field layer converts integer minor units (cents) to display units.
 *
 * @example
 * <NumberField aria-label="Quantity" defaultValue={2} min={0} max={99} />
 *
 * @example
 * // Money
 * <NumberField
 *   aria-label="Amount"
 *   format={{ style: "currency", currency: "USD" }}
 *   min={0}
 *   step={0.01}
 * />
 */
export function NumberField({
  "aria-label": ariaLabel,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
  "aria-labelledby": ariaLabelledBy,
  id,
  placeholder,
  prefix,
  suffix,
  hideControls = false,
  className,
  inputClassName,
  inputRef,
  ...rootProps
}: NumberFieldProps) {
  return (
    <BaseNumberField.Root
      data-slot="number-field"
      // `data-field-group` is what lets `base.css` paint the forced-colours focus outline (FOC-7)
      // on the GROUP rather than on the inner input, whose own outline the group would clip.
      data-field-group=""
      // DS-67: no ARIA on the group. `aria-invalid` lives on the INPUT below, the element a
      // screen reader announces, and that is also what paints the group: upstream's InputGroup
      // draws its invalid hairline through `:has([data-slot][aria-invalid=true])`, a DESCENDANT
      // selector the input satisfies. `control-paint.browser.test.tsx` measures it against a
      // plain invalid `Input`.
      render={<InputGroup />}
      className={cn("overflow-hidden", className)}
      id={id}
      {...rootProps}
    >
      {hideControls ? null : (
        <InputGroupAddon align="inline-start" className={stepperSlotClasses}>
          <InputGroupButton
            render={<BaseNumberField.Decrement />}
            data-slot="number-field-decrement"
            aria-label="Decrease"
            className={cn(stepperClasses, "border-e border-input")}
          >
            <Minus />
          </InputGroupButton>
        </InputGroupAddon>
      )}
      {prefix == null ? null : (
        <InputGroupAddon
          align="inline-start"
          data-slot="number-field-prefix"
          className={hideControls ? undefined : "ps-2"}
        >
          {prefix}
        </InputGroupAddon>
      )}
      <BaseNumberField.Input
        // No `data-slot` of its own: the inner control keeps upstream's
        // `data-slot="input-group-control"`, which is the hook `InputGroup` selects on for BOTH
        // its focus border and its invalid hairline. Renaming it would silently unpaint the box.
        // `InputGroupInput` is upstream's Input, itself a Base UI `Field.Control`, so inside a
        // `Field` it registers a control id of its own. Handing it the explicit `id` too keeps the
        // two registrations agreeing, so `FieldLabel` points at the id the caller chose.
        // Only a DEFINED id — an explicit `undefined` would override the id Base UI hands the
        // input, and the steppers' `aria-controls` would point at nothing.
        render={<InputGroupInput {...(id ? { id } : {})} />}
        ref={inputRef}
        aria-label={ariaLabel}
        // Only DEFINED props: Base UI's merge lets an explicit `undefined` erase the label and
        // message ids an enclosing `Field` resolved for the input.
        {...(ariaLabelledBy ? { "aria-labelledby": ariaLabelledBy } : {})}
        {...(ariaDescribedBy ? { "aria-describedby": ariaDescribedBy } : {})}
        aria-invalid={ariaInvalid}
        placeholder={placeholder}
        // TYP-10 (ours) — tabular figures. This control formats its value through
        // `Intl.NumberFormat`, so without fixed-width digits the text reflows on every step,
        // every keystroke and every blur-reformat: hold the increment stepper and the number
        // visibly jitters. `cn` keeps `inputClassName` able to override it.
        className={cn("tabular-nums", inputClassName)}
      />
      {suffix == null ? null : (
        <InputGroupAddon
          align="inline-end"
          data-slot="number-field-suffix"
          className={hideControls ? undefined : "pe-2"}
        >
          {suffix}
        </InputGroupAddon>
      )}
      {hideControls ? null : (
        <InputGroupAddon align="inline-end" className={stepperSlotClasses}>
          <InputGroupButton
            render={<BaseNumberField.Increment />}
            data-slot="number-field-increment"
            aria-label="Increase"
            className={cn(stepperClasses, "border-s border-input")}
          >
            <Plus />
          </InputGroupButton>
        </InputGroupAddon>
      )}
    </BaseNumberField.Root>
  );
}

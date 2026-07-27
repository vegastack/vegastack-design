// @vegastack number-field@0.3.0 sha256-VZwCxTYwzYxhQXPMi8z4NBCaDw0y+z7PDE3kw5jG9Ew=

"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { NumberField as BaseNumberField } from "@base-ui/react/number-field";
import { cn } from "@vegastack/design";
import {
  mergeRefs,
  useShakeOnInvalid,
  type ShakeSignal,
} from "@/components/ui/use-animation-replay";

/* ---
`NumberField` exists because the roster had no numeric input at all: quantities, limits,
percentages and money were all being typed into a text `Input` with hand-rolled parsing.
Base UI's NumberField supplies the hard parts — locale-aware parsing/formatting
(`format: Intl.NumberFormatOptions` + `locale`), min/max/step with snap, keyboard
stepping, wheel scrub — so this wrapper's job is chrome: Input's exact addon-group
visual (border, focus tint, invalid, disabled, dark input wash, the 28/32/40 size
scale) with full-height stepper buttons.

Money is a format prop, not a component: pass
`format={{ style: "currency", currency: "INR" }}`. A CRM-specific `money-input` in a
general design system is the wrong shape (scope call S4). Minor-units conversion (cents
in the API, display units here) belongs at the app's field layer — documented on the
docs page, deliberately not built in.

Deliberately NOT done here:
- No `ScrubArea`. Pointer-scrubbing on a label is a power affordance with no keyboard
  or touch equivalent; consumers who want it compose `BaseNumberField.ScrubArea`
  directly inside a custom `prefix`.
- No native `size` attribute. Like `Input`, the `size` prop is the control-height
  variant (`--size-sm/md/lg`) and deliberately replaces the numeric HTML attribute.
- No re-exposed `Group` part. The root IS the bordered group here; splitting parts
  would only invite layouts the chrome cannot honour.
--- */

/** Props accepted by `NumberField`. */
export interface NumberFieldProps extends Omit<
  React.ComponentProps<typeof BaseNumberField.Root>,
  "className" | "prefix"
> {
  /**
   * Control height on the shared 28/32/40 scale (`--size-sm/md/lg`), matching
   * `Input`/Button/Select. (The native numeric `size` attribute is intentionally
   * replaced by this variant prop, exactly as on `Input`.)
   * @default 'default'
   */
  size?: "sm" | "default" | "lg";
  /**
   * Accessible name for the numeric input. Required in practice unless a
   * wrapping `Field`/`aria-labelledby` supplies one — the input must never be
   * unnamed.

   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Placeholder for the empty input.

   * @default undefined
   */
  placeholder?: string;
  /**
   * Non-editable addon before the input (a unit, an icon, a currency code) —
   * `Input`'s addon idiom. Plain strings render as muted, non-selectable text.

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
  /** Extra classes for the bordered group root.
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
   * Bump to re-shake the field while it is ALREADY invalid — it auto-shakes
   * once when it first becomes invalid. See `useShakeOnInvalid`.

   * @default undefined
   */
  shakeSignal?: ShakeSignal;
  /**
   * Ref forwarded to the inner `<input>` element.

   * @default undefined
   */
  inputRef?: React.Ref<HTMLInputElement>;
}

/**
 * Group chrome — mirrors `Input`'s addon-mode wrapper exactly: the border,
 * focus tint, invalid tint, disabled wash and dark input tint all live on the
 * root, driven by the inner input's state via `has-*`/`focus-within`.
 */
const groupClasses =
  "flex w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-transparent text-base " +
  "dark:bg-input/(--alpha-input) " +
  "focus-within:border-ring/(--alpha-tint-border) " +
  "has-aria-invalid:border-destructive-border/(--alpha-tint-border) " +
  "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-(--opacity-dim) has-disabled:bg-muted";

const sizeClasses = {
  sm: "h-(--size-sm) text-sm",
  default: "h-(--size-md)",
  lg: "h-(--size-lg)",
} as const;

/** Addon-slot classes — identical to `Input`'s. */
const addonClasses =
  "flex shrink-0 items-center text-muted-foreground select-none whitespace-nowrap";

/**
 * Full-height stepper buttons flanking the field ([−] input [+]): each is the
 * control's full height and ≥ 24px wide, so the pointer targets meet WCAG 2.5.8
 * without a hit-area expansion — unlike the traditional half-height stacked
 * spinners, which cannot. They keep the centralized `:focus-visible` outline
 * (never `outline-none` — P0-02) with the sanctioned negative offset so the
 * root's `overflow-hidden` cannot clip it.
 */
const stepperClasses =
  "flex h-full w-(--size-sm) shrink-0 items-center justify-center text-muted-foreground " +
  "hover:text-foreground hover:bg-muted " +
  "focus-visible:-outline-offset-2 " +
  "disabled:pointer-events-none disabled:opacity-(--opacity-dim) " +
  "data-disabled:pointer-events-none data-disabled:opacity-(--opacity-dim)";

/**
 * `NumberField` — a locale-aware numeric input on Base UI's NumberField, in
 * `Input`'s exact field chrome. Formatting is `Intl`: pass
 * `format={{ style: "percent" }}`, `{ style: "currency", currency: "EUR" }`,
 * or unit options, plus `locale` to pin one. `min`/`max`/`step` (with
 * `snapOnStep`), keyboard stepping (arrows; <kbd>Shift</kbd> for `largeStep`,
 * <kbd>Alt</kbd> for `smallStep`), and wheel scrubbing all come from Base UI.
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
  size = "default",
  "aria-label": ariaLabel,
  placeholder,
  prefix,
  suffix,
  hideControls = false,
  className,
  inputClassName,
  shakeSignal,
  inputRef,
  ...rootProps
}: NumberFieldProps) {
  // The shake plays on the root group — that is where the visible border lives
  // (Input's addon-mode precedent) — and watches the inner input's invalid flag.
  const {
    invalidRef: shakeInvalidRef,
    className: shakeClassName,
    onAnimationEnd: shakeAnimationEnd,
  } = useShakeOnInvalid({ shakeSignal });
  const mergedInputRef = React.useMemo(
    () => mergeRefs(inputRef, shakeInvalidRef),
    [inputRef, shakeInvalidRef],
  );

  return (
    <BaseNumberField.Root
      data-slot="number-field"
      data-size={size}
      className={cn(groupClasses, sizeClasses[size], shakeClassName, className)}
      onAnimationEnd={shakeAnimationEnd}
      {...rootProps}
    >
      {hideControls ? null : (
        <BaseNumberField.Decrement
          data-slot="number-field-decrement"
          aria-label="Decrease"
          className={cn(stepperClasses, "border-e border-input")}
        >
          <Minus className="size-(--icon-compact)" aria-hidden />
        </BaseNumberField.Decrement>
      )}
      {prefix != null ? (
        <span
          data-slot="number-field-prefix"
          className={cn(addonClasses, "ps-3")}
        >
          {prefix}
        </span>
      ) : null}
      <BaseNumberField.Input
        ref={mergedInputRef}
        data-slot="number-field-input"
        aria-label={ariaLabel}
        placeholder={placeholder}
        className={cn(
          "h-full w-full min-w-0 flex-1 bg-transparent py-1 text-inherit outline-none",
          "placeholder:text-muted-foreground-faint",
          "selection:bg-primary selection:text-primary-foreground",
          "disabled:cursor-not-allowed",
          prefix != null ? "ps-1.5" : "ps-3",
          suffix != null ? "pe-1.5" : "pe-3",
          inputClassName,
        )}
      />
      {suffix != null ? (
        <span
          data-slot="number-field-suffix"
          className={cn(addonClasses, "pe-3")}
        >
          {suffix}
        </span>
      ) : null}
      {hideControls ? null : (
        <BaseNumberField.Increment
          data-slot="number-field-increment"
          aria-label="Increase"
          className={cn(stepperClasses, "border-s border-input")}
        >
          <Plus className="size-(--icon-compact)" aria-hidden />
        </BaseNumberField.Increment>
      )}
    </BaseNumberField.Root>
  );
}

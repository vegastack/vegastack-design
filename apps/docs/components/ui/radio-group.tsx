// @vegastack radio-group@0.2.0 sha256-trvsG583lPuhkshTXPHB+2qwST69Sh3ePN0aFQOUA0Q=

"use client";

import * as React from "react";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import { Radio } from "@base-ui/react/radio";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";
import {
  mergeRefs,
  useShakeOnInvalid,
  type ShakeSignal,
} from "@/components/ui/use-animation-replay";

/**
 * RadioGroup layout variants. `orientation` controls how the items flow and is
 * mirrored onto `aria-orientation` for assistive tech: `vertical` stacks options
 * in a column (the default), `horizontal` lays them out in a wrapping row. Arrow
 * keys move the selection in either direction regardless of layout. Every value
 * is a semantic token (no hardcoded spacing colors).
 */
export const radioGroupVariants = cva(
  "group/radio-group flex text-foreground",
  {
    variants: {
      orientation: {
        // The 12px structural gap keeps adjacent 26px invisible radio targets
        // disjoint even when the visible 16px dots sit in compact field rows.
        vertical: "flex-col gap-3",
        horizontal: "flex-row flex-wrap items-center gap-4",
      },
    },
    defaultVariants: { orientation: "vertical" },
  },
);

/** Props accepted by `RadioGroup`. */
export interface RadioGroupProps
  extends
    Omit<
      BaseRadioGroup.Props<string>,
      "value" | "defaultValue" | "onValueChange"
    >,
    VariantProps<typeof radioGroupVariants> {
  /**
   * The controlled value of the currently selected item. Pair with
   * `onValueChange`. Use `defaultValue` for an uncontrolled group instead.
   * @default undefined
   */
  value?: string;
  /**
   * The value selected on first render (uncontrolled).
   * @default undefined
   */
  defaultValue?: string;
  /**
   * Called with the next value whenever the selection changes.

   * @default undefined
   */
  onValueChange?: (
    value: string,
    eventDetails: BaseRadioGroup.ChangeEventDetails,
  ) => void;
  /**
   * Disable the whole group — every item becomes non-interactive.
   * @default false
   */
  disabled?: boolean;
}

/**
 * `RadioGroup` — a set of mutually-exclusive options built on
 * [Base UI Radio Group](https://base-ui.com/react/components/radio). Renders a
 * `<div role="radiogroup">` that shares selection state across its
 * {@link RadioGroupItem} children and wires roving-tabindex arrow-key navigation.
 *
 * Selecting an item fires `onValueChange` with its `value`. Use `value` +
 * `onValueChange` for controlled state, or `defaultValue` for uncontrolled.
 * Give each item an accessible name — wrap it in a {@link Field} (horizontal),
 * or pass an `aria-label`. When using a sibling `<label htmlFor>`, render the
 * item as a native button with Base UI's `nativeButton render={<button />}`.
 *
 * @example
 * // Uncontrolled, with labels via Field
 * <RadioGroup defaultValue="comfortable">
 *   <Field label="Comfortable" orientation="horizontal">
 *     <RadioGroupItem value="comfortable" />
 *   </Field>
 *   <Field label="Compact" orientation="horizontal">
 *     <RadioGroupItem value="compact" />
 *   </Field>
 * </RadioGroup>
 *
 * @example
 * // Controlled
 * const [value, setValue] = React.useState('card');
 * <RadioGroup value={value} onValueChange={setValue} aria-label="Payment method">
 *   <RadioGroupItem value="card" aria-label="Card" />
 *   <RadioGroupItem value="paypal" aria-label="PayPal" />
 * </RadioGroup>
 */
export function RadioGroup({
  className,
  orientation = "vertical",
  "aria-orientation": ariaOrientation,
  ref,
  ...props
}: RadioGroupProps) {
  const resolvedOrientation = orientation ?? "vertical";

  return (
    <BaseRadioGroup
      ref={ref}
      data-slot="radio-group"
      data-orientation={resolvedOrientation}
      aria-orientation={ariaOrientation ?? resolvedOrientation}
      className={cn(
        radioGroupVariants({ orientation: resolvedOrientation }),
        className,
      )}
      {...props}
    />
  );
}

/**
 * Control-dot scale (register P1-04) — mirrors Checkbox: `sm` 14px, `default` 16px.
 * Both are below the WCAG 2.5.8 24×24 CSS px minimum target size, so each adds an
 * invisible `::before` hit-area expansion (the root already carries `relative`
 * below) sized to reach ≥24×24 without changing the visible dot. The 1px border
 * makes the pseudo-element's containing padding box 14px/12px, so a 6px inset
 * yields effective 26px / 24px targets.
 */
const itemSizeClasses = {
  sm: "size-3.5 before:absolute before:-inset-1.5",
  default: "size-4 before:absolute before:-inset-1.5",
} as const;

/** Props accepted by `RadioGroupItem`. */
export interface RadioGroupItemProps extends React.ComponentProps<
  typeof Radio.Root
> {
  /**
   * Dot size — `sm` 14px / `default` 16px, mirroring Checkbox (register P1-04).
   * @default 'default'
   */
  size?: keyof typeof itemSizeClasses;
  /**
   * The unique value this item contributes to the group when selected.
   */
  value: string;
  /**
   * Prevent the user from selecting this item while still rendering it.
   * @default false
   */
  disabled?: boolean;
  /**
   * Replace the rendered element via Base UI `render` composition. Pass a
   * `ReactElement` or a render function — Base UI merges this
   * item's `className`, `data-slot`, and state `data-*` onto your element,
   * forwards the ref, and keeps the `<Radio.Indicator>` child. The element must
   * support `role="radio"` semantics.

   * @default undefined
   */
  render?: React.ComponentProps<typeof Radio.Root>["render"];
  /**
   * Bump to a new value (e.g. a submit-attempt counter) to re-shake this item while it's
   * ALREADY invalid — the item already auto-shakes once the moment it first becomes invalid;
   * this is only for repeat failures against a still-invalid group. See `useShakeOnInvalid`
   * (`use-animation-replay`).

   * @default undefined
   */
  shakeSignal?: ShakeSignal;
}

/**
 * `RadioGroupItem` — a single selectable radio inside a {@link RadioGroup}.
 * Renders a styled `<span role="radio">` plus a hidden `<input>`, with a neutral
 * ink dot indicator when selected. Token-only: `border-input` by default,
 * neutral `border-primary` with a filled `bg-primary` ink dot when checked, the centralized base.css `:focus-visible`
 * outline, and `rounded-full`. Must be a descendant of a `RadioGroup`.
 *
 * Pair it with a label for accessibility — inside a {@link Field} (horizontal)
 * or with an `aria-label` for a standalone item. For sibling
 * `<label htmlFor>` patterns, follow Base UI's guidance and pass
 * `nativeButton render={<button />}` so the `id` targets a native button root.
 *
 * @example
 * <RadioGroupItem value="card" aria-label="Card" />
 */
export function RadioGroupItem({
  className,
  size = "default",
  shakeSignal,
  onAnimationEnd,
  ref,
  ...props
}: RadioGroupItemProps) {
  // Destructured so hook fields (stable across renders) can appear in dependency arrays
  // without dragging the per-render container object in (react-hooks/exhaustive-deps).
  const {
    invalidRef: shakeInvalidRef,
    className: shakeClassName,
    onAnimationEnd: shakeAnimationEnd,
  } = useShakeOnInvalid({ shakeSignal });
  const rootRef = React.useMemo(
    () => mergeRefs(ref, shakeInvalidRef),
    [ref, shakeInvalidRef],
  );
  const handleAnimationEnd: NonNullable<RadioGroupItemProps["onAnimationEnd"]> =
    React.useCallback(
      (event) => {
        shakeAnimationEnd(event);
        onAnimationEnd?.(event);
      },
      [onAnimationEnd, shakeAnimationEnd],
    );

  return (
    <Radio.Root
      ref={rootRef}
      data-slot="radio-group-item"
      data-size={size}
      className={cn(
        "peer relative inline-flex shrink-0 items-center justify-center rounded-full border border-input bg-transparent text-current",
        itemSizeClasses[size],
        "dark:bg-input/(--alpha-input)",
        "hover:border-ring/(--alpha-tint-border)",
        "data-checked:border-primary",
        "aria-invalid:border-destructive-border/(--alpha-tint-border) data-invalid:border-destructive-border/(--alpha-tint-border)",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-(--opacity-dim)",
        "group-has-disabled/field:opacity-(--opacity-dim)",
        shakeClassName,
        className,
      )}
      onAnimationEnd={handleAnimationEnd}
      {...props}
    >
      <Radio.Indicator
        data-slot="radio-group-indicator"
        className="flex size-2 items-center justify-center rounded-full bg-primary transition-transform duration-fast ease-standard data-unchecked:scale-0"
      />
    </Radio.Root>
  );
}

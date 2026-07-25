// @vegastack otp-input@0.3.0 sha256-byIclpH9mzq11jGU9eTiQeVNnZxd12C1aYaR3fVSZNI=

"use client";

import * as React from "react";
import { OTPField } from "@base-ui/react/otp-field";
import { cn } from "@vegastack/design";
import {
  mergeRefs,
  useShakeOnInvalid,
  type ShakeSignal,
} from "@/components/ui/use-animation-replay";

/** Props accepted by `OTPInput`. */
export interface OTPInputProps extends Omit<
  React.ComponentProps<typeof OTPField.Root>,
  "children" | "length" | "onValueChange"
> {
  /**
   * Slot size on the shared 28/32/40 control scale (register P1-04).
   * @default 'default'
   */
  size?: keyof typeof slotSizeClasses;
  /**
   * Number of character slots to render.
   * @default 6
   */
  length?: number;
  /**
   * Optional slot grouping for layouts like `123-456`. When omitted, slots are
   * rendered as one flat group. If supplied, the positive numbers must add up to
   * `length` (or they define `length` when the length prop is omitted).

   * @default undefined
   */
  groups?: readonly number[];
  /**
   * Visual content rendered between OTP groups.
   * @default '-'
   */
  separator?: React.ReactNode;
  /**
   * Extra classes merged into every group separator.

   * @default undefined
   */
  separatorClassName?: string;
  /**
   * The OTP value (controlled). Pair with {@link OTPInputProps.onValueChange}.

   * @default undefined
   */
  value?: string;
  /**
   * The uncontrolled initial value.

   * @default undefined
   */
  defaultValue?: string;
  /**
   * Callback fired when the value changes. The second argument is Base UI's
   * event-details object (`eventDetails.reason` is `'input-change'`,
   * `'input-clear'`, `'input-paste'`, or `'keyboard'`).

   * @default undefined
   */
  onValueChange?: (
    value: string,
    eventDetails: OTPField.Root.ChangeEventDetails,
  ) => void;
  /**
   * Fired when every slot is filled — use it to auto-submit a verification code.

   * @default undefined
   */
  onValueComplete?: (
    value: string,
    eventDetails: OTPField.Root.CompleteEventDetails,
  ) => void;
  /**
   * Mask entered characters (renders each slot as a password input).
   * @default false
   */
  mask?: boolean;
  /**
   * Disable the whole field — every slot becomes non-interactive and dimmed.
   * @default false
   */
  disabled?: boolean;
  /**
   * Accessible name for the field, applied to the first slot. Use this when there
   * is no visible `<label>`/`FieldLabel` wired to the input.

   * @default undefined
   */
  "aria-label"?: string;
  /**
   * Extra classes for the slot row (the `OTPField.Root` `<div>`).

   * @default undefined
   */
  className?: string;
  /**
   * Extra classes merged into every slot `<input>`.

   * @default undefined
   */
  slotClassName?: string;
  /**
   * Bump to a new value (e.g. a submit-attempt counter) to re-shake the field while it's
   * ALREADY invalid — the field already auto-shakes once the moment it first becomes invalid
   * (Base UI sets `data-invalid` when this is wrapped in a `Field.Root`, or pass `aria-invalid`
   * manually); this is only for repeat failures against a still-invalid code. See
   * `useShakeOnInvalid` (`use-animation-replay`).

   * @default undefined
   */
  shakeSignal?: ShakeSignal;
}

/**
 * Per-slot input classes — each slot is a real `<input>` rendered as a square,
 * bordered box. The focused slot raises its z-index and darkens its border to
 * the `ring` token — the border is the sole focus cue (no ring), matching `Input`
 * and the other text-entry fields.
 * Every value is a semantic token (no hardcoded colors, no arbitrary values).
 */

/** Slot scale (register P1-04) — the shared 28/32/40 control tier with a type tier to match. */
const slotSizeClasses = {
  sm: "size-(--size-sm) text-base",
  default: "size-(--size-md) text-lg",
  lg: "size-(--size-lg) text-xl",
} as const;

const slotClasses =
  "relative flex items-center justify-center rounded-md border border-input bg-transparent text-center font-mono text-foreground  outline-none " +
  "dark:bg-input/(--alpha-input) " +
  "caret-foreground selection:bg-primary selection:text-primary-foreground " +
  "focus:z-(--z-raised) focus:border-ring/(--alpha-tint-border) " +
  "data-invalid:border-destructive-border/(--alpha-tint-border) " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-(--opacity-dim) disabled:bg-muted";

const separatorClasses =
  "select-none px-0.5 font-mono text-base text-muted-foreground";

function normalizeGroups(
  length: number,
  groups: readonly number[] | undefined,
): number[] {
  if (groups == null || groups.length === 0) return [length];

  const normalized = groups
    .map((group) => (Number.isFinite(group) ? Math.floor(group) : 0))
    .filter((group) => group > 0);
  const total = normalized.reduce((sum, group) => sum + group, 0);

  return normalized.length > 0 && total === length ? normalized : [length];
}

/**
 * `OTPInput` — a multi-slot one-time-passcode input built on Base UI
 * `OTPField`. Renders `length` square slots (default 6), each a real focusable
 * `<input>`, with full keyboard navigation (arrows/backspace/delete), paste
 * distribution across slots, autofill of a `one-time-code`, optional `mask`ing,
 * and a `disabled` state. Token-only styling — every slot is `border-input`
 * `rounded-md`, the focused slot's border darkens to `ring`.
 *
 * Controlled with `value` + `onValueChange`, or uncontrolled with `defaultValue`.
 * Numeric by default (`validationType="numeric"` from Base UI). The first slot is
 * labeled by the field's `aria-label` (or a wrapping `<label>`/`FieldLabel`);
 * later slots are auto-labeled `Character N of M`. Pass `groups={[3, 3]}` to
 * render grouped layouts with a Base UI `OTPField.Separator` between groups.
 *
 * @example
 * // Controlled, 6 digits
 * const [code, setCode] = React.useState('');
 * <OTPInput aria-label="Verification code" value={code} onValueChange={setCode} />
 *
 * @example
 * // Auto-submit when complete
 * <OTPInput aria-label="2FA code" onValueComplete={(v) => verify(v)} />
 */
export function OTPInput({
  length: lengthProp,
  groups,
  separator = "-",
  className,
  slotClassName,
  separatorClassName,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  size = "default",
  shakeSignal,
  onAnimationEnd,
  ref,
  ...props
}: OTPInputProps) {
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
  const handleAnimationEnd: NonNullable<OTPInputProps["onAnimationEnd"]> =
    React.useCallback(
      (event) => {
        shakeAnimationEnd(event);
        onAnimationEnd?.(event);
      },
      [onAnimationEnd, shakeAnimationEnd],
    );
  const firstSlotId = React.useId();
  const groupedLength = groups?.reduce(
    (sum, group) =>
      sum + (Number.isFinite(group) ? Math.max(Math.floor(group), 0) : 0),
    0,
  );
  const requestedLength =
    lengthProp ?? (groupedLength && groupedLength > 0 ? groupedLength : 6);
  const length = Number.isFinite(requestedLength)
    ? Math.max(1, Math.floor(requestedLength))
    : 6;
  const inputGroups = normalizeGroups(length, groups);
  let slotIndex = 0;

  const renderSlot = (index: number) => (
    <OTPField.Input
      key={index}
      id={index === 0 ? firstSlotId : undefined}
      data-slot="otp-input-slot"
      // Slot 0 inherits the field's accessible name (Base UI ignores
      // `aria-label` here, deferring to a wrapping `<label>` / `FieldLabel`);
      // later slots get a positional label for screen-reader context.
      aria-label={
        index === 0 ? undefined : `Character ${index + 1} of ${length}`
      }
      className={cn(slotClasses, slotSizeClasses[size], slotClassName)}
    />
  );

  const root = (
    <OTPField.Root
      ref={rootRef}
      length={length}
      data-slot="otp-input"
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "flex max-w-full items-center gap-2 overflow-x-auto",
        shakeClassName,
        className,
      )}
      onAnimationEnd={handleAnimationEnd}
      {...props}
    >
      {inputGroups.map((groupLength, groupIndex) => (
        <React.Fragment key={`${groupIndex}-${groupLength}`}>
          {Array.from({ length: groupLength }, () => renderSlot(slotIndex++))}
          {groupIndex < inputGroups.length - 1 ? (
            <OTPField.Separator
              data-slot="otp-input-separator"
              className={cn(separatorClasses, separatorClassName)}
            >
              {separator}
            </OTPField.Separator>
          ) : null}
        </React.Fragment>
      ))}
    </OTPField.Root>
  );

  // Base UI ignores `aria-label` on the first slot and labels the field via a
  // wrapping `<label>` / `FieldLabel` / `aria-labelledby`. When the caller
  // passes a bare `aria-label` (and no external `aria-labelledby`), render a
  // visually hidden explicit label associated to slot 0. A wrapping label would
  // be invalid because the OTP root contains several labelable inputs.
  if (ariaLabel != null && ariaLabelledBy == null) {
    return (
      <>
        <label htmlFor={firstSlotId} className="sr-only">
          {ariaLabel}
        </label>
        {root}
      </>
    );
  }

  return root;
}

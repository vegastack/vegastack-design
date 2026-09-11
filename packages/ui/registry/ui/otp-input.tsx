// @vegastack otp-input@0.7.5 sha256-tj28m74dS6aK9vMBje9+CHq8VYhwN3gwF1IqGcuejtU=

"use client";

import * as React from "react";
import { OTPField } from "@base-ui/react/otp-field";
import { cn, fieldControl } from "@vegastack/design";

/** Props accepted by `OTPInput`. */
export interface OTPInputProps extends Omit<
  React.ComponentProps<typeof OTPField.Root>,
  "children" | "length" | "onValueChange"
> {
  /**
   * Slot size on the shared 28/32/40 control scale (register P1-04).
   * @default 'md'
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
}

/**
 * Per-slot input classes — each slot is a real `<input>` rendered as a square, bordered box.
 * The border/focus/invalid/disabled chrome is `fieldControl` (audit B1-11), identical to
 * `Input` and `Textarea`; only what is SPECIFIC to a code slot lives here: the mono centred
 * glyph, the caret ink, and the raised z-index that lifts the focused slot's tinted border
 * above its neighbours' hairlines. `outline-hidden` rather than the outline-REMOVING utility, so
 * `forced-colors: active` still has an outline to repaint once it has erased the border tint
 * (audit B1-01).
 */

/** Slot scale (register P1-04) — the shared 28/32/40 control tier with a type tier to match. */
const slotSizeClasses = {
  sm: "size-(--size-sm) text-base",
  md: "size-(--size-md) text-lg",
  lg: "size-(--size-lg) text-xl",
} as const;

// `.join(" ")`, not `+`. These two fragments were concatenated with no separator, so the slot
// shipped `outline-hiddencaret-foreground` and BOTH utilities vanished: a focused slot measured
// `outline-style: solid` / `outline-width: 2px`, the only text-entry surface in the system wearing
// the global focus ring — contradicting the JSDoc above it and AGENTS.md § Accessibility
// (2026-09-09). `class-glue` in `design-lint` now rejects the seam.
const slotClasses = [
  "relative flex items-center justify-center text-center font-mono text-foreground outline-hidden",
  "caret-foreground focus:z-(--z-raised)",
].join(" ");

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
  "aria-invalid": ariaInvalid,
  size = "md",
  ref,
  ...props
}: OTPInputProps) {
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
      // `aria-invalid` is forwarded to every SLOT, not left on the root (2026-09-09). The root is a
      // plain container: `aria-invalid` there is ignored by assistive tech AND invisible to
      // `fieldControl`, whose destructive tint is a `aria-invalid:` variant on the control itself —
      // so `<OTPInput aria-invalid />` measured the neutral `--input` border and announced nothing.
      // The `Field` path is unaffected: there the invalid state arrives through Base UI's context
      // as `data-invalid` on each slot, which `fieldControl` already reads.
      aria-invalid={ariaInvalid}
      className={cn(
        fieldControl,
        slotClasses,
        slotSizeClasses[size],
        slotClassName,
      )}
    />
  );

  const root = (
    <OTPField.Root
      ref={ref}
      length={length}
      data-slot="otp-input"
      aria-labelledby={ariaLabelledBy}
      className={cn(
        "flex max-w-full items-center gap-2 overflow-x-auto",
        className,
      )}
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

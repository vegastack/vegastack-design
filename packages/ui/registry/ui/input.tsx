// @vegastack input@0.2.0 sha256-wouolyNURvdA+a2mBRHWPmeCIPLjG1fhSPiA7JdYZx8=

"use client";

import * as React from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "@vegastack/design";
import {
  mergeRefs,
  useShakeOnInvalid,
  type ShakeSignal,
} from "@/components/ui/use-animation-replay";

/** Props accepted by `Input`. */
export interface InputProps extends Omit<
  React.ComponentProps<typeof BaseInput>,
  "prefix" | "className" | "size"
> {
  /**
   * Control height on the shared 28/32/40 scale (`--size-sm/md/lg`), matching
   * Button and Select. (The native numeric `size` attribute is intentionally
   * replaced by this variant prop.)
   * @default 'default'
   */
  size?: keyof typeof sizeClasses;
  /**
   * Classes for the Base UI input element. Accepts Base UI's state-function
   * form, so styles can respond to field state such as `focused` or `invalid`.

   * @default undefined
   */
  className?: React.ComponentProps<typeof BaseInput>["className"];
  /**
   * Classes for the wrapper used only when `prefix` or `suffix` is present.

   * @default undefined
   */
  containerClassName?: string;
  /**
   * Content rendered as a non-editable addon before the input (e.g.
   * `"app.vegastack.com/"` or an icon). Switches the component into addon mode:
   * the `<input>` is wrapped in a bordered group and the border/ring/disabled
   * styling moves to the wrapper. Plain strings render as muted, non-selectable
   * label text.

   * @default undefined
   */
  prefix?: React.ReactNode;
  /**
   * Content rendered as a non-editable addon after the input (e.g. a unit like
   * `".com"` or an icon). Switches the component into addon mode (see `prefix`).

   * @default undefined
   */
  suffix?: React.ReactNode;
  /**
   * Bump to a new value (e.g. a submit-attempt counter) to re-shake the input while it's
   * ALREADY invalid — the input already auto-shakes once the moment it first becomes invalid
   * (via `aria-invalid`/`data-invalid`, whether set manually or by a wrapping `Field`); this is
   * only for repeat failures against a still-invalid input. See `useShakeOnInvalid`
   * (`use-animation-replay`).

   * @default undefined
   */
  shakeSignal?: ShakeSignal;
}

/**
 * DARK-TINT SCOPING (register P1-24, documented policy): form CONTROLS — and only form
 * controls — carry `dark:bg-input/(--alpha-input)`. In dark, a fully-transparent field on the
 * near-black canvas reads as a void; the translucent input tint keeps the fill affordance
 * while still blending with whichever surface hosts the control. SURFACES (card/popover/
 * dialog/sheet) deliberately have no `dark:bg-*` override — they are theme-authored tokens.
 * The six controls sharing this: input, textarea, select trigger, checkbox, radio, OTP slots.
 */
/**
 * Shared field classes for the input surface in standalone mode — border, ring,
 * `aria-invalid`, and `disabled` styling all live here. Every value is a
 * semantic token (no hardcoded colors, no arbitrary values).
 */
const fieldClasses =
  "w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base  outline-none " +
  "focus:border-ring/(--alpha-tint-border) " +
  "dark:bg-input/(--alpha-input) " +
  "placeholder:text-muted-foreground-faint " +
  "selection:bg-primary selection:text-primary-foreground " +
  "file:inline-flex file:h-(--size-xs) file:border-0 file:bg-transparent file:text-base file:font-medium file:text-foreground " +
  "aria-invalid:border-destructive-border/(--alpha-tint-border) " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-(--opacity-dim) disabled:bg-muted";

/**
 * Wrapper classes for addon mode — mirrors the field's border/ring/disabled
 * treatment, but driven by the inner input's focus/invalid/disabled state via
 * `has-*` selectors so the whole group reacts as one field.
 */
const groupClasses =
  "flex w-full min-w-0 items-center overflow-hidden rounded-md border border-input bg-transparent text-base  " +
  "dark:bg-input/(--alpha-input) " +
  "focus-within:border-ring/(--alpha-tint-border) " +
  "has-aria-invalid:border-destructive-border/(--alpha-tint-border) " +
  "has-disabled:pointer-events-none has-disabled:cursor-not-allowed has-disabled:opacity-(--opacity-dim) has-disabled:bg-muted";

/** Addon-slot classes — muted, non-selectable label text that hugs the field. */
const addonClasses =
  "flex shrink-0 items-center text-muted-foreground select-none whitespace-nowrap";

/**
 * Control-scale size classes (register P1-04) — the shared 28/32/40 tier, matching
 * Button/Select. `sm` steps the type down one tier like every other sm control.
 */
const sizeClasses = {
  sm: "h-(--size-sm) text-sm",
  default: "h-(--size-md)",
  lg: "h-(--size-lg)",
} as const;

function mergeInputClassName(
  baseClassName: string,
  userClassName: InputProps["className"],
): React.ComponentProps<typeof BaseInput>["className"] {
  if (typeof userClassName === "function") {
    return (state) => cn(baseClassName, userClassName(state));
  }

  return cn(baseClassName, userClassName);
}

/**
 * `Input` — a styled Base UI input supporting every HTML input `type`, with
 * Base UI `render`, `onValueChange`, state-function `className`, Field state
 * data attributes, optional prefix/suffix addons, and auto-shake-on-invalid.
 *
 * `'use client'`: wiring the auto-shake behavior (a `MutationObserver` watching
 * `aria-invalid`/`data-invalid`) requires refs and state, so this component is a client
 * component unconditionally — it is no longer server-safe/hook-free.
 *
 * In addon mode (`prefix`/`suffix` set), the shake plays on the wrapper group (the element that
 * actually carries the visible border) rather than the bare `<input>` inside it, since that's
 * where the border lives; standalone mode shakes the input itself. Either way the animated
 * element is never remounted, so a focused input never loses focus/caret/selection when it
 * shakes — see `useShakeOnInvalid` (`use-animation-replay`) for why that rules out key-remount.
 *
 * @example
 * <Input type="email" autoComplete="email" aria-label="Email" />
 */
export function Input({
  className,
  containerClassName,
  type = "text",
  size = "default",
  prefix,
  suffix,
  shakeSignal,
  onAnimationEnd,
  ref,
  ...props
}: InputProps) {
  // Destructured so hook fields (stable across renders) can appear in dependency arrays
  // without dragging the per-render container object in (react-hooks/exhaustive-deps).
  const {
    invalidRef: shakeInvalidRef,
    className: shakeClassName,
    onAnimationEnd: shakeAnimationEnd,
  } = useShakeOnInvalid({ shakeSignal });
  const inputRef = React.useMemo(
    () => mergeRefs(ref, shakeInvalidRef),
    [ref, shakeInvalidRef],
  );
  const handleAnimationEnd: NonNullable<InputProps["onAnimationEnd"]> =
    React.useCallback(
      (event) => {
        onAnimationEnd?.(event);
      },
      [onAnimationEnd],
    );
  const handleStandaloneAnimationEnd: NonNullable<
    InputProps["onAnimationEnd"]
  > = React.useCallback(
    (event) => {
      shakeAnimationEnd(event);
      onAnimationEnd?.(event);
    },
    [onAnimationEnd, shakeAnimationEnd],
  );

  if (prefix != null || suffix != null) {
    const addonInputClassName = mergeInputClassName(
      cn(
        "h-full min-w-0 flex-1 bg-transparent py-1 text-base outline-none",
        "placeholder:text-muted-foreground-faint",
        "selection:bg-primary selection:text-primary-foreground",
        "disabled:cursor-not-allowed",
        prefix != null ? "pl-1.5" : "pl-3",
        suffix != null ? "pr-1.5" : "pr-3",
      ),
      className,
    );

    return (
      <div
        data-slot="input-group"
        data-size={size}
        className={cn(
          groupClasses,
          sizeClasses[size],
          shakeClassName,
          containerClassName,
        )}
        onAnimationEnd={shakeAnimationEnd}
      >
        {prefix != null ? (
          <span data-slot="input-prefix" className={cn(addonClasses, "pl-3")}>
            {prefix}
          </span>
        ) : null}
        <BaseInput
          ref={inputRef}
          type={type}
          data-slot="input"
          className={addonInputClassName}
          onAnimationEnd={handleAnimationEnd}
          {...props}
        />
        {suffix != null ? (
          <span data-slot="input-suffix" className={cn(addonClasses, "pr-3")}>
            {suffix}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <BaseInput
      ref={inputRef}
      type={type}
      data-slot="input"
      data-size={size}
      className={mergeInputClassName(
        cn(fieldClasses, sizeClasses[size], shakeClassName),
        className,
      )}
      onAnimationEnd={handleStandaloneAnimationEnd}
      {...props}
    />
  );
}

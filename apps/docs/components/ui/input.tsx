// @vegastack input@0.9.1 sha256-TqFkbwcICwn3siTatsfyGLoZVlx0t8vK+ZFR+4Uund4=

"use client";

import * as React from "react";
import { Input as BaseInput } from "@base-ui/react/input";
import { cn } from "@vegastack/design";

/** Props accepted by `Input`. */
export interface InputProps extends Omit<
  React.ComponentProps<typeof BaseInput>,
  "prefix" | "className" | "size"
> {
  /**
   * Control height on the shared 28/32/40 scale (`h-7/md/lg`), matching
   * Button and Select. (The native numeric `size` attribute is intentionally
   * replaced by this variant prop.)
   * @default 'md'
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
}

/**
 * DARK-TINT SCOPING (register P1-24, documented policy): form CONTROLS — and only form
 * controls — carry `dark:bg-input/30`. In dark, a fully-transparent field on the
 * near-black canvas reads as a void; the translucent input tint keeps the fill affordance
 * while still blending with whichever surface hosts the control. SURFACES (card/popover/
 * dialog/sheet) deliberately have no `dark:bg-*` override — they are theme-authored tokens.
 * That tint lives in the shared field chrome/the bordered field-GROUP chrome (`@vegastack/design`), which every
 * text-entry control in the system shares (audit B1-11) — this file no longer owns a private
 * copy of the border/focus/invalid/disabled grammar.
 *
 * `outline-hidden` is the text-entry form, and the outline-REMOVING utility is banned here: it
 * compiles to a TRANSPARENT
 * 2px outline, so the field shows nothing in normal colours while `forced-colors: active`
 * repaints it — the border tint that normally signals focus is erased outright by the forced
 * palette (audit B1-01). The one-and-only visible fallback is the unlayered block in
 * `@vegastack/design-tokens`' `base.css`; this class just refuses to suppress it.
 */
const standaloneClasses = [
  // `.join(" ")`, not `+`. This was written as two concatenated literals with no separator, so it
  // compiled to `outline-hiddenfile:inline-flex` and BOTH utilities silently vanished — an Input
  // that kept the global `:focus-visible` outline the doctrine bans on text entry, and a file input
  // with none of its file: styling (#100, 2026-09-09). `class-whitespace` cannot see a missing
  // space between two literals; it can only see a stray one inside one. An array removes the seam.
  "w-full min-w-0 px-3 py-1 text-sm outline-hidden",
  "file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
].join(" ");

/** Addon-slot classes — muted, non-selectable label text that hugs the field. */
const addonClasses =
  "flex shrink-0 items-center text-muted-foreground select-none whitespace-nowrap";

/**
 * Control-scale size classes (register P1-04) — the shared 28/32/40 tier, matching
 * Button/Select. `sm` steps the type down one tier like every other sm control.
 */
const sizeClasses = {
  sm: "h-7 text-xs",
  md: "h-8",
  lg: "h-10",
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
 * data attributes, and optional prefix/suffix addons.
 *
 * The invalid SHAKE is not here. It belongs to `Field`, which owns validation feedback for
 * every control it wraps (audit D5) — one observer per field instead of the same thirty-five
 * lines of `MutationObserver` + `mergeRefs` + `onAnimationEnd` plumbing repeated in five
 * controls, and `Textarea`, which never had it, gains it for free. A bare `<Input aria-invalid>`
 * outside a `Field` tints its border and does not shake; wrap it in `Field` to get the motion.
 *
 * @example
 * <Input type="email" autoComplete="email" aria-label="Email" />
 */
export function Input({
  className,
  containerClassName,
  type = "text",
  size = "md",
  prefix,
  suffix,
  ref,
  ...props
}: InputProps) {
  if (prefix != null || suffix != null) {
    const addonInputClassName = mergeInputClassName(
      cn(
        "h-full min-w-0 flex-1 bg-transparent py-1 text-sm outline-hidden",
        "placeholder:text-muted-foreground",
        "disabled:cursor-not-allowed",
        prefix != null ? "ps-1.5" : "ps-3",
        suffix != null ? "pe-1.5" : "pe-3",
      ),
      className,
    );

    return (
      <div
        data-slot="input-group"
        data-size={size}
        data-field-group=""
        className={cn(
          "rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring/70 data-focused:border-ring/70 not-focus-within:aria-invalid:border-destructive not-focus-within:has-aria-invalid:border-destructive not-focus-within:data-invalid:border-destructive has-disabled:cursor-not-allowed has-disabled:bg-input/50 has-disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 dark:bg-input/30",
          "flex w-full min-w-0 items-center overflow-hidden text-sm",
          sizeClasses[size],
          containerClassName,
        )}
      >
        {prefix != null ? (
          <span data-slot="input-prefix" className={cn(addonClasses, "ps-3")}>
            {prefix}
          </span>
        ) : null}
        <BaseInput
          ref={ref}
          type={type}
          data-slot="input"
          className={addonInputClassName}
          {...props}
        />
        {suffix != null ? (
          <span data-slot="input-suffix" className={cn(addonClasses, "pe-3")}>
            {suffix}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <BaseInput
      ref={ref}
      type={type}
      data-slot="input"
      data-size={size}
      className={mergeInputClassName(
        cn(
          "rounded-lg border border-input bg-transparent transition-colors outline-none placeholder:text-muted-foreground focus:border-ring/70 not-focus:aria-invalid:border-destructive not-focus:data-invalid:border-destructive disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:bg-input/50 data-disabled:opacity-50 dark:bg-input/30 dark:disabled:bg-input/80",
          standaloneClasses,
          sizeClasses[size],
        ),
        className,
      )}
      {...props}
    />
  );
}

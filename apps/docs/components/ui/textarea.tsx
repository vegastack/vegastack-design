// @vegastack textarea@0.2.0 sha256-7QcO2hTCoUS9oQL6PtUANEt6nFeOAg6pB8vdvKfbfcE=

import * as React from "react";
import { cn } from "@vegastack/design";

/** Props accepted by `Textarea`. */
export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /**
   * Density tier — `sm` compact, `default`, `lg` roomy. Multiline fields scale by
   * min-height + padding (register P1-04).
   * @default 'default'
   */
  size?: keyof typeof sizeClasses;
  /**
   * When `true`, the field grows to fit its content instead of scrolling,
   * using native CSS `field-sizing: content`. Combine with `rows` for a
   * starting height and the `max-h-*` utility (via `className`) for a cap.
   * Falls back to a fixed, scrollable height in browsers without support.
   * @default false
   */
  autoGrow?: boolean;
}

/**
 * Shared field classes for the textarea surface — border, `aria-invalid`,
 * and `disabled` styling all live here. Mirrors `Input` exactly so the two
 * fields are visually identical: the darkened `ring/70` border is the sole
 * focus cue (no ring). Every value is a semantic token (no hardcoded colors,
 * no arbitrary values).
 */

/**
 * Density scale (register P1-04) — multiline fields size by minimum height and
 * padding rather than the fixed control heights; `sm` steps the type down a tier.
 */
const sizeClasses = {
  sm: "min-h-12 px-2.5 py-1.5 text-sm",
  default: "min-h-16 px-3 py-2",
  lg: "min-h-24 px-3 py-2.5",
} as const;

const fieldClasses =
  "w-full min-w-0 rounded-md border border-input bg-transparent text-base  outline-none " +
  "focus:border-ring/(--alpha-tint-border) " +
  "dark:bg-input/(--alpha-input) " +
  "placeholder:text-muted-foreground-faint " +
  "selection:bg-primary selection:text-primary-foreground " +
  "aria-invalid:border-destructive-border/(--alpha-tint-border) " +
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-(--opacity-dim) disabled:bg-muted";

/**
 * `Textarea` — a styled native `<textarea>` for multi-line text entry, with
 * `error` (`aria-invalid`) and `disabled` states and a darkened focus border
 * (no ring, matching `Input`). Resizes vertically by default; pass `autoGrow` to
 * size to content via CSS `field-sizing`. Shares its border/token styling with `Input`. Pure
 * presentational and server-safe — no hooks, no `'use client'`. Forwards its
 * ref to the underlying `<textarea>` for focus management and form libraries.
 *
 * @example
 * <Textarea aria-label="Description" autoGrow />
 */
export function Textarea({
  className,
  autoGrow = false,
  size = "default",
  ref,
  ...props
}: TextareaProps) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      data-size={size}
      className={cn(
        fieldClasses,
        sizeClasses[size],
        autoGrow ? "resize-none field-sizing-content" : "resize-y",
        className,
      )}
      {...props}
    />
  );
}

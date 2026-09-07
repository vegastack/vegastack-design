// @vegastack textarea@0.6.0 sha256-qkBzcntDnHXUos8V7JwDz4PA3EyGlV3bKiahnjjISnM=

import * as React from "react";
import { cn, fieldControl } from "@vegastack/design";

/** Props accepted by `Textarea`. */
export interface TextareaProps extends React.ComponentProps<"textarea"> {
  /**
   * Density tier — `sm` compact, `default`, `lg` roomy. Multiline fields scale by
   * min-height + padding (register P1-04).
   * @default 'md'
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
 * Density scale (register P1-04) — multiline fields size by minimum height and
 * padding rather than the fixed control heights; `sm` steps the type down a tier.
 */
const sizeClasses = {
  sm: "min-h-12 px-2.5 py-1.5 text-sm",
  md: "min-h-16 px-3 py-2",
  lg: "min-h-24 px-3 py-2.5",
} as const;

/**
 * Layout only — the border/focus/invalid/disabled chrome is `fieldControl`, the one recipe
 * every text-entry control in the system shares (audit B1-11), so `Input` and `Textarea` can
 * no longer drift apart. `outline-hidden` rather than the outline-REMOVING utility: it compiles to a
 * transparent 2px outline that `forced-colors: active` repaints, which is what keeps a focused
 * textarea locatable once the forced palette has erased the border tint (audit B1-01).
 */
const layoutClasses = "w-full min-w-0 text-base outline-hidden";

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
  size = "md",
  ref,
  ...props
}: TextareaProps) {
  return (
    <textarea
      ref={ref}
      data-slot="textarea"
      data-size={size}
      className={cn(
        fieldControl,
        layoutClasses,
        sizeClasses[size],
        autoGrow ? "resize-none field-sizing-content" : "resize-y",
        className,
      )}
      {...props}
    />
  );
}

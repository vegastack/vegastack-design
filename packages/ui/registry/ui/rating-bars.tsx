// @vegastack rating-bars@0.61.2 sha256-VxXFCRXU3qFRW4ov9cxWMBg/mckD4szMkoY/xK3SnAc=

import * as React from "react";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * RatingBars — a short qualitative rating read at a glance: a label, a row of segments of which
 * the first `value` are lit, and the word that says what the rating means ("Speed ▮▮▮▮▯ Fast").
 * Several stack into a two-column grid of comparable meters, so a set of them (speed, cost,
 * quality) lines up on the label column without a wrapper.
 *
 * The root is the `meter`: named by `label`, read as `valueText`. The segments are decoration of
 * that one value and are hidden from assistive technology. Lit segments use the `primary` fill and
 * unlit ones the `muted` track, the same pair `Progress` uses. Server-safe; no motion.
 * ----------------------------------------------------------------------------------------------*/

/** Props for `RatingBars`: the root `<div>`'s own props except `children`, plus the rating. */
export interface RatingBarsProps extends Omit<
  React.ComponentPropsWithRef<"div">,
  "children"
> {
  /**
   * How many segments are lit, clamped to `0`–`max`; a fraction lights the nearest whole number of
   * segments and is reported as given in `aria-valuenow`. `null` lights none — for a rating that is
   * not known; say so in `valueText` ("Not listed").
   */
  value: number | null;
  /**
   * How many segments the row has: a whole number of at least 1 (a fraction is floored, anything
   * below 1 draws one segment).
   * @default 5
   */
  max?: number;
  /** The visible label before the segments, and the meter's accessible name ("Speed"). */
  label: string;
  /** The word after the segments, and the meter's `aria-valuetext` ("Fast"). */
  valueText: string;
  /**
   * `default` draws 12×8px segments; `sm` draws 10×6px ones for a dense panel.
   * @default "default"
   */
  size?: "sm" | "default";
}

/**
 * `RatingBars` — a labelled row of lit and unlit segments with a word after it, read as one
 * `meter`. Server-safe.
 *
 * @example
 * <RatingBars label="Speed" value={4} valueText="Fast" />
 * <RatingBars label="Cost" value={null} valueText="Not listed" size="sm" />
 */
export function RatingBars({
  value,
  max = 5,
  label,
  valueText,
  size = "default",
  className,
  ...props
}: RatingBarsProps): React.ReactElement {
  // A row needs at least one segment, and the meter a maximum above its minimum.
  const total = Number.isFinite(max) ? Math.max(1, Math.floor(max)) : 5;
  const now =
    value === null || !Number.isFinite(value)
      ? 0
      : Math.min(total, Math.max(0, value));
  const lit = Math.round(now);
  return (
    <div
      data-slot="rating-bars"
      data-size={size}
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={now}
      aria-valuetext={valueText}
      className={cn(
        "grid grid-cols-[4rem_auto_1fr] items-center gap-2",
        className,
      )}
      {...props}
    >
      <span
        data-slot="rating-bars-label"
        className="min-w-0 truncate text-xs text-muted-foreground"
      >
        {label}
      </span>
      <span
        data-slot="rating-bars-segments"
        className="flex items-center gap-0.5"
      >
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            data-slot="rating-bars-segment"
            aria-hidden
            data-lit={index < lit}
            className={cn(
              "rounded-xs",
              size === "sm" ? "h-1.5 w-2.5" : "h-2 w-3",
              index < lit ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </span>
      <span
        data-slot="rating-bars-value"
        className="min-w-0 truncate text-xs text-foreground"
      >
        {valueText}
      </span>
    </div>
  );
}

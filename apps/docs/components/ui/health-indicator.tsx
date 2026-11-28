// @vegastack health-indicator@0.143.1 sha256-7oyCR0pnWYenzjm5frswscqVSRVk4fmslZngpX1nDpk=

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  CircleAlert,
  CircleCheck,
  CircleDashed,
  CircleX,
  type LucideIcon,
} from "lucide-react";

/* ---
`HealthIndicator` says how a piece of work is going, as its latest update set it: on track, at
risk, off track, or no update (grey). It is a glyph and the words beside it, never a fill: status
hues are a glyph (COL-25), and a status colour always means status (UI ground rules T3). On track
is a check, so it is `primary`, never green; at risk takes the warning ink and off track the
destructive ink, each with its own symbol so the colour is never the only cue.

`labelHidden` keeps the glyph alone with the words as its accessible name, for a slot whose row
already carries the name (a timeline's leading slot).
--- */

/** How work is going: its latest update's health, or `none` when there is no recent update. */
export type Health = "on_track" | "at_risk" | "off_track" | "none";

const GLYPH: Record<Health, LucideIcon> = {
  on_track: CircleCheck,
  at_risk: CircleAlert,
  off_track: CircleX,
  none: CircleDashed,
};

// COL-25: a check is `check` ink, never green; the warning and destructive hues are glyph inks only.
const INK: Record<Health, string> = {
  on_track: "text-check",
  at_risk: "text-warning-text",
  off_track: "text-destructive-text",
  none: "text-muted-foreground",
};

/** The default words for each health. */
export const HEALTH_LABEL: Record<Health, string> = {
  on_track: "On track",
  at_risk: "At risk",
  off_track: "Off track",
  none: "No update",
};

/** Props accepted by `HealthIndicator`. */
export interface HealthIndicatorProps extends Omit<
  React.ComponentPropsWithRef<"span">,
  "children"
> {
  /** The health to show. */
  health: Health;
  /** 16px glyph with 14px words in a row; 14px glyph with 12px words in a meta line. @default 16 */
  size?: 14 | 16;
  /** Words in place of the health's own ("No update in 10 days"). @default the health's words */
  label?: string;
  /**
   * Show the glyph alone; the words become its accessible name. For a slot whose row already says
   * what it is, like a timeline's leading slot.
   * @default false
   */
  labelHidden?: boolean;
}

/**
 * `HealthIndicator` — a health glyph and its words: ✓ On track in primary, ! At risk in the
 * warning ink, ✗ Off track in the destructive ink, ◌ No update muted.
 *
 * @example
 * <HealthIndicator health="at_risk" />
 *
 * @example
 * <HealthIndicator health="none" size={14} label="No update in 10 days" />
 *
 * @example
 * <HealthIndicator health="on_track" labelHidden />
 */
export function HealthIndicator({
  health,
  size = 16,
  label,
  labelHidden = false,
  className,
  ...props
}: HealthIndicatorProps) {
  const Glyph = GLYPH[health];
  const words = label ?? HEALTH_LABEL[health];
  return (
    <span
      data-slot="health-indicator"
      data-health={health}
      data-size={size}
      {...(labelHidden ? { role: "img", "aria-label": words } : {})}
      className={cn(
        "inline-flex max-w-full min-w-0 shrink-0 items-center",
        size === 14 ? "gap-1 text-xs" : "gap-1.5 text-sm",
        health === "none" ? "text-muted-foreground" : "text-foreground",
        className,
      )}
      {...props}
    >
      <Glyph
        aria-hidden
        strokeWidth={1.5}
        className={cn(
          "shrink-0",
          size === 14 ? "size-3.5" : "size-4",
          INK[health],
        )}
      />
      {labelHidden ? null : <span className="truncate">{words}</span>}
    </span>
  );
}

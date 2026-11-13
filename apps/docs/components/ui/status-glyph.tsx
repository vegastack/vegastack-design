// @vegastack status-glyph@0.77.0 sha256-xC0F8YavGu36Dd8kqS/+VFKejGVOzb6HcM9tWkNQd8E=

import * as React from "react";
import { cn } from "@vegastack/design";
import {
  Check,
  CircleDashed,
  CircleSlash,
  Contrast,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

/** The six states a chat step, task, run or request can be in. */
export type ChatStatus =
  "pending" | "running" | "done" | "skipped" | "failed" | "needs-you";

const GLYPH: Record<ChatStatus, LucideIcon> = {
  pending: CircleDashed,
  // ◐ drawn still: a turn has one moving thing, its live line (MOT-14).
  running: Contrast,
  done: Check,
  skipped: CircleSlash,
  failed: X,
  "needs-you": TriangleAlert,
};

// COL-25: a check is the blue accent and never green; status hues are a glyph, never a fill.
const INK: Record<ChatStatus, string> = {
  pending: "text-muted-foreground",
  running: "text-info-text",
  done: "text-info-text",
  skipped: "text-muted-foreground",
  failed: "text-muted-foreground",
  "needs-you": "text-warning-text",
};

const LABEL: Record<ChatStatus, string> = {
  pending: "Not started",
  running: "Running",
  done: "Done",
  skipped: "Skipped",
  failed: "Failed",
  "needs-you": "Needs you",
};

/** Props accepted by `StatusGlyph`. */
export interface StatusGlyphProps extends Omit<
  React.ComponentProps<"svg">,
  "children"
> {
  /** Which state to draw. */
  status: ChatStatus;
  /** 16px in a row, 14px in a meta line. @default 16 */
  size?: 14 | 16;
  /**
   * The accessible name. Defaults to the state in words ("Done", "Needs you"); pass `null` when the
   * words beside the glyph already say it, and the glyph is hidden from assistive technology.
   * @default the state's own word
   */
  label?: string | null;
}

/**
 * One glyph per state, the same everywhere in agent UI (COL-25): ✓ done in the blue accent, ◌ not
 * started and ⊘ skipped muted, ◐ running in the accent and still, ✗ failed muted (always with
 * words beside it), ⚠ needs you in the warning ink. Lucide outline at stroke 1.5.
 *
 * @example
 * <StatusGlyph status="done" />
 *
 * @example
 * <span className="flex items-center gap-2 text-sm">
 *   <StatusGlyph status="failed" label={null} /> Couldn't open the sheet
 * </span>
 */
function StatusGlyph({
  status,
  size = 16,
  label,
  className,
  ...props
}: StatusGlyphProps) {
  const Glyph = GLYPH[status];
  const name = label === undefined ? LABEL[status] : label;
  return (
    <Glyph
      data-slot="status-glyph"
      data-status={status}
      strokeWidth={1.5}
      {...(name
        ? { role: "img", "aria-label": name }
        : { "aria-hidden": true })}
      className={cn(
        "shrink-0",
        size === 14 ? "size-3.5" : "size-4",
        INK[status],
        className,
      )}
      {...props}
    />
  );
}

export { StatusGlyph };

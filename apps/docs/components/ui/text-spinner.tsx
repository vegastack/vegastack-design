// @vegastack text-spinner@0.88.0 sha256-VaCIggmqUoHuDSumij5piLGP2ush7VsjVrnPzKUMx20=

import * as React from "react";
import { cn } from "@vegastack/design";

/**
 * The bolt, `[row, column]` on a 4×6 dot grid read top to bottom: the bolt of the VegaStack V,
 * drawn in 13 dots so it still reads at chat text size.
 */
const BOLT = [
  [0, 2],
  [0, 3],
  [1, 1],
  [1, 2],
  [2, 0],
  [2, 1],
  [2, 2],
  [2, 3],
  [3, 1],
  [3, 2],
  [4, 0],
  [4, 1],
  [5, 0],
] as const;

/** Props accepted by `TextSpinner`. */
export interface TextSpinnerProps extends Omit<
  React.ComponentProps<"span">,
  "children"
> {
  /**
   * `working` (Strike: the bolt fills top to bottom, holds, clears) is real work — a chat turn's
   * live line, Send while it sends. `waiting` (Pulse: the whole bolt fades slowly) is before the
   * first step and while the connection comes back — "Thinking", "Reconnecting", a composer notice.
   * @default "working"
   */
  variant?: "working" | "waiting";
  /**
   * What a screen reader hears; the bolt itself is hidden from assistive technology. Pass `""`
   * when the words beside the spinner already say it ("Searching the web").
   * @default "Working"
   */
  label?: string;
}

/**
 * The one inline text loader (ICO-8, amended 2026-11-15): a dot-matrix bolt in the muted ink, as
 * tall as capital letters and in a fixed slot, so the words beside it never move. A turn shows at
 * most one. It is CSS only — `motion-strike` steps each row's dots, `motion-pulse` the whole bolt —
 * so it renders on the server and never re-renders. Both keyframes end on the full bolt, so under
 * reduced motion it is a still bolt. Page-level loading keeps `Spinner` (lucide `Loader`).
 *
 * @example
 * <p className="flex items-center gap-2 text-sm text-muted-foreground">
 *   <TextSpinner label="" /> Searching the web · 12s
 * </p>
 *
 * @example
 * <TextSpinner variant="waiting" label="Reconnecting" />
 */
function TextSpinner({
  variant = "working",
  label = "Working",
  className,
  ...props
}: TextSpinnerProps) {
  const working = variant === "working";
  return (
    <span
      data-slot="text-spinner"
      data-variant={variant}
      className={cn(
        "inline-flex h-lh w-[0.6em] shrink-0 items-center justify-center align-bottom text-muted-foreground select-none",
        className,
      )}
      {...props}
    >
      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 40 60"
        data-slot="text-spinner-bolt"
        className={cn(
          // `size-*` (not `h-*`) so a container's `[&_svg:not([class*='size-'])]:size-*` — a
          // Button, the live line's trigger, a notice's lead — leaves the bolt at text size.
          "size-[0.72em] w-[0.48em] shrink-0 fill-current",
          !working && "motion-pulse",
        )}
      >
        {BOLT.map(([row, column]) => (
          <circle
            key={`${row}-${column}`}
            cx={column * 10 + 5}
            cy={row * 10 + 5}
            r={3.7}
            className={working ? "motion-strike" : undefined}
            style={
              working ? ({ "--vs-row": row } as React.CSSProperties) : undefined
            }
          />
        ))}
      </svg>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export { TextSpinner };

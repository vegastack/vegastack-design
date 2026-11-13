// @vegastack text-spinner@0.76.3 sha256-DbOWaRKin8PTwYzk1oJF7NISpVlpzobzZziHErlDSkY=

import * as React from "react";
import { cn } from "@vegastack/design";

/** The braille frames, one every `--duration-loader-frame` (80ms). */
const BRAILLE = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;
/** The dots frames, one every `--duration-loader-dots` (300ms); padded so every frame is three wide. */
const DOTS = ["·  ", "·· ", "···"] as const;

/** Props accepted by `TextSpinner`. */
export interface TextSpinnerProps extends Omit<
  React.ComponentProps<"span">,
  "children"
> {
  /**
   * `braille` (⠋ ⠙ ⠹ …) is the live line of a chat turn and Send while it sends; `dots` (· ·· ···)
   * says "not started yet" — "·· Thinking", "·· Reconnecting", a composer notice.
   * @default "braille"
   */
  variant?: "braille" | "dots";
  /**
   * What a screen reader hears; the glyph itself is hidden from assistive technology. Pass `""`
   * when the words beside the spinner already say it ("Searching the web").
   * @default "Working"
   */
  label?: string;
}

/**
 * The one inline text loader (ICO-8, amended 2026-11-13): a monospace braille spinner in the muted
 * ink, as wide as one frame so the words beside it never move. A turn shows at most one. It is CSS
 * only — the frames sit in a one-line clip and `motion-frames` steps them up a line at a time — so
 * it renders on the server and never re-renders. Under reduced motion it is a still `…`. Page-level
 * loading keeps `Spinner` (lucide `Loader`).
 *
 * @example
 * <p className="flex items-center gap-2 text-sm text-muted-foreground">
 *   <TextSpinner label="" /> Searching the web · 12s
 * </p>
 *
 * @example
 * <TextSpinner variant="dots" label="Reconnecting" />
 */
function TextSpinner({
  variant = "braille",
  label = "Working",
  className,
  ...props
}: TextSpinnerProps) {
  const frames = variant === "dots" ? DOTS : BRAILLE;
  return (
    <span
      data-slot="text-spinner"
      data-variant={variant}
      className={cn(
        "inline-flex h-lh shrink-0 overflow-y-clip align-bottom font-mono text-muted-foreground tabular-nums select-none",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        data-slot="text-spinner-frames"
        className={cn(
          "flex flex-col motion-frames motion-reduce:hidden",
          variant === "dots"
            ? "[--vs-frame-count:3] [--vs-frame-duration:var(--duration-loader-dots)]"
            : "[--vs-frame-count:10]",
        )}
      >
        {frames.map((frame) => (
          <span key={frame} className="h-lh whitespace-pre">
            {frame}
          </span>
        ))}
      </span>
      <span aria-hidden="true" className="hidden motion-reduce:inline">
        …
      </span>
      {label ? <span className="sr-only">{label}</span> : null}
    </span>
  );
}

export { TextSpinner };

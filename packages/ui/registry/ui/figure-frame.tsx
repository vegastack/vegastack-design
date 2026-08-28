// @vegastack figure-frame@0.5.0 sha256-oDkC7eQti4LTdaxSRfQH//Tecw6K4zRql61LoZrJF7g=

import * as React from "react";
import { cn } from "@vegastack/design";

/** Props accepted by `FigureFrame`. */
export interface FigureFrameProps extends React.ComponentPropsWithRef<"figure"> {
  /**
   * The framed media — an image, video, or a live component demo. Fills the
   * frame at `aspectRatio`.
   */
  children: React.ReactNode;
  /**
   * FIG-annotation caption text. Rendered in the mono voice
   * (`font-mono` + `text-mono-label`, uppercase — the spec's 12px floor;
   * this component intentionally does not reach for the spec's optional
   * 10px FIG-annotation minimum, since no token below 12px is shipped yet —
   * see the component's audit note).
   * @default undefined
   */
  caption?: React.ReactNode;
  /**
   * Figure number/id prefixed as `FIG. {figureNumber}` before the caption
   * (e.g. `figureNumber="01"` → `"FIG. 01"`). Omit for a caption with no
   * numbering.
   * @default undefined
   */
  figureNumber?: React.ReactNode;
  /**
   * CSS `aspect-ratio` for the media area (e.g. `"16/9"`, `"4/3"`, `"1/1"`).
   * @default '16/9'
   */
  aspectRatio?: string;
}

/**
 * `FigureFrame` — a sharp-cornered (`rounded-(--radius-sharp)`) media frame
 * with an optional mono FIG-annotation caption below it (audit
 * 17-brand-direction §Shape: the marketing "sharp" gesture is rationed to
 * CTAs, chips, and figure frames — never applied wholesale). Use it to frame
 * a screenshot, a video, or a live component demo on a marketing surface.
 *
 * @example
 * <FigureFrame figureNumber="01" caption="Component registry — live preview">
 *   <img src="/screenshot.png" alt="The VegaStack component registry" />
 * </FigureFrame>
 */
export function FigureFrame({
  caption,
  figureNumber,
  aspectRatio = "16/9",
  className,
  children,
  ref,
  ...props
}: FigureFrameProps) {
  return (
    <figure
      ref={ref}
      data-slot="figure-frame"
      className={cn(
        "overflow-hidden rounded-(--radius-sharp) border border-border bg-card",
        className,
      )}
      {...props}
    >
      <div
        data-slot="figure-frame-media"
        className="relative w-full overflow-hidden [aspect-ratio:var(--figure-frame-ratio)]"
        style={{ "--figure-frame-ratio": aspectRatio } as React.CSSProperties}
      >
        {children}
      </div>
      {caption ? (
        <figcaption
          data-slot="figure-frame-caption"
          className="flex items-center gap-2 border-t border-border px-3 py-2 font-mono text-mono-label text-muted-foreground uppercase"
        >
          {figureNumber !== undefined ? (
            <span
              data-slot="figure-frame-number"
              // shrink-0 + nowrap: on narrow screens the flex child would otherwise
              // shrink and wrap internally ("FIG." / number on separate lines),
              // interleaving with the caption text.
              className="shrink-0 whitespace-nowrap text-foreground"
            >
              FIG. {figureNumber}
            </span>
          ) : null}
          <span data-slot="figure-frame-caption-text">{caption}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}

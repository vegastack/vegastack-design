// @vegastack ruled-band@0.3.0 sha256-r9lEZOz0+OEghOCCasEQX9LgsR7g3IV5EiDLLRV7Ei8=

import * as React from "react";
import { cn } from "@vegastack/design";

/* ------------------------------------------------------------------------------------------------
 * RuledBand — the editorial mono-label band (Wave 4, from the marketing teardown's ruled-page
 * furniture): a hairline-bounded strip with the mono VOICE on both ends ("CHANGELOG / 2026" ↔
 * "39 UPDATES", serial codes, dates). Server-safe; uppercase stays call-site-applied and
 * mono-exclusive (D20) — `RuledBandLabel` bakes the mono voice in, you add `uppercase`.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `RuledBand`. */
export interface RuledBandProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * Which edges carry the rule.
   * @default 'both'
   */
  rule?: "both" | "top" | "bottom";
}

/**
 * `RuledBand` — compose `RuledBandLabel`s (or any inline content) inside;
 * `justify-between` spreads the ends.
 *
 * @example
 * <RuledBand>
 *   <RuledBandLabel className="uppercase">Changelog / 2026</RuledBandLabel>
 *   <RuledBandLabel className="uppercase">39 updates</RuledBandLabel>
 * </RuledBand>
 */
export function RuledBand({
  className,
  rule = "both",
  ref,
  ...props
}: RuledBandProps) {
  return (
    <div
      ref={ref}
      data-slot="ruled-band"
      data-rule={rule}
      className={cn(
        "flex items-baseline justify-between gap-4 border-border py-2",
        rule !== "bottom" && "border-t",
        rule !== "top" && "border-b",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `RuledBandLabel`. */
export type RuledBandLabelProps = React.ComponentPropsWithRef<"span">;

/** `RuledBandLabel` — one end of the band, in the mono-label voice.
 *
 * @example
 * <RuledBandLabel />
 */
export function RuledBandLabel({ className, ...props }: RuledBandLabelProps) {
  return (
    <span
      data-slot="ruled-band-label"
      className={cn(
        "font-mono text-mono-label text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

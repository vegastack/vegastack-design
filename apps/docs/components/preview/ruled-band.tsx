"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/ruled-band` (dogfoods the registry) → auto-scanned.
import { RuledBand, RuledBandLabel } from "@/components/ui/ruled-band";

export function ruledBand(): ReactNode {
  // Uppercase applied at the call site — the mono voice rule (D20).
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <RuledBand>
        <RuledBandLabel className="uppercase">Changelog / 2026</RuledBandLabel>
        <RuledBandLabel className="uppercase">39 updates</RuledBandLabel>
      </RuledBand>
      <RuledBand rule="bottom">
        <RuledBandLabel className="uppercase">
          A conversation with
        </RuledBandLabel>
        <RuledBandLabel className="uppercase">LDS · 042</RuledBandLabel>
      </RuledBand>
    </Wrapper>
  );
}

/**
 * The band as real editorial FURNITURE rather than a lone strip: `rule="top"` opening a
 * section, content under it, `rule="bottom"` closing it. That is the composition the band
 * exists for, and it is the one a single-strip preview cannot show.
 */
export function ruledBandSection(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-0">
      <RuledBand rule="top">
        <RuledBandLabel className="uppercase">Section 03</RuledBandLabel>
        <RuledBandLabel className="uppercase">Distribution</RuledBandLabel>
      </RuledBand>
      <div className="flex flex-col gap-2 py-6">
        <p className="text-h3 text-foreground">Pulled, never pushed</p>
        <p className="max-w-prose text-muted-foreground">
          Downstream projects ask the registry what changed and take the diff
          deliberately — the band brackets the passage without a heading rule of
          its own.
        </p>
      </div>
      <RuledBand rule="bottom">
        <RuledBandLabel className="uppercase">Continued</RuledBandLabel>
        <RuledBandLabel className="uppercase">04 / 09</RuledBandLabel>
      </RuledBand>
    </Wrapper>
  );
}

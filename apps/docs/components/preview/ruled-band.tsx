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

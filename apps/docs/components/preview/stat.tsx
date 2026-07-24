"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/stat` (dogfoods the registry) → auto-scanned.
import {
  Stat,
  StatDelta,
  StatEmpty,
  StatLabel,
  StatValue,
} from "@/components/ui/stat";

export function stat(): ReactNode {
  // Record-highlights voice: 12/500 muted labels over 14/500 values, honest empties.
  return (
    <Wrapper className="items-start gap-8">
      <Stat>
        <StatLabel>Estimated ARR</StatLabel>
        <StatValue>$1M–$10M</StatValue>
      </Stat>
      <Stat>
        <StatLabel>Employee range</StatLabel>
        <StatValue>11–50</StatValue>
      </Stat>
      <Stat>
        <StatLabel>Connection strength</StatLabel>
        <StatEmpty>No connection</StatEmpty>
      </Stat>
    </Wrapper>
  );
}

export function statTiles(): ReactNode {
  // Dashboard-tile voice: lg values on the type-scale cap + delta lines.
  return (
    <Wrapper className="items-start gap-10">
      <Stat size="lg">
        <StatLabel>Active companies</StatLabel>
        <StatValue>1,284</StatValue>
        <StatDelta intent="up">↑ 12% this month</StatDelta>
      </Stat>
      <Stat size="lg">
        <StatLabel>Churned</StatLabel>
        <StatValue>17</StatValue>
        <StatDelta intent="down">↓ 3 vs last month</StatDelta>
      </Stat>
      <Stat size="lg">
        <StatLabel>Open deals</StatLabel>
        <StatValue>62</StatValue>
        <StatDelta>No change</StatDelta>
      </Stat>
    </Wrapper>
  );
}

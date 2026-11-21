"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/health-indicator` (dogfoods the registry) → auto-scanned.
import {
  HEALTH_LABEL,
  HealthIndicator,
  type Health,
} from "@/components/ui/health-indicator";

const HEALTHS = Object.keys(HEALTH_LABEL) as Health[];

export function healthIndicator(): ReactNode {
  return (
    <Wrapper>
      {HEALTHS.map((health) => (
        <HealthIndicator key={health} health={health} />
      ))}
    </Wrapper>
  );
}

export function healthIndicatorSizes(): ReactNode {
  return (
    <Wrapper className="flex-col items-start">
      <HealthIndicator health="at_risk" />
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        INI-4 ·{" "}
        <HealthIndicator health="none" size={14} label="No update in 10 days" />
      </span>
    </Wrapper>
  );
}

export function healthIndicatorGlyphOnly(): ReactNode {
  return (
    <Wrapper>
      {HEALTHS.map((health) => (
        <HealthIndicator key={health} health={health} labelHidden />
      ))}
    </Wrapper>
  );
}

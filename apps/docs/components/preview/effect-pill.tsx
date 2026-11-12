"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/effect-pill` (dogfoods the registry) → auto-scanned.
import { EffectPill, PLAN_EFFECTS } from "@/components/ui/effect-pill";

export function effectPill(): ReactNode {
  return (
    <Wrapper>
      {PLAN_EFFECTS.map((effect) => (
        <EffectPill key={effect} effect={effect} />
      ))}
    </Wrapper>
  );
}

export function effectPillIconOnly(): ReactNode {
  return (
    <Wrapper>
      {PLAN_EFFECTS.map((effect) => (
        <EffectPill key={effect} effect={effect} iconOnly />
      ))}
    </Wrapper>
  );
}

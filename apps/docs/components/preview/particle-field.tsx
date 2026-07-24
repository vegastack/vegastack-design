"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { MarketingSurface } from "@/components/ui/marketing-surface";
import { ParticleField } from "@/components/ui/particle-field";

export function particleField(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="relative w-full overflow-hidden rounded-lg p-8">
        <ParticleField seed={7} count={48} />
        <p className="relative text-display-sm text-foreground">
          Hero atmosphere
        </p>
        <p className="relative max-w-md text-muted-foreground">
          A deterministic, very-low-alpha phosphor field — decorative only,
          lazy-mounted.
        </p>
      </MarketingSurface>
    </Wrapper>
  );
}

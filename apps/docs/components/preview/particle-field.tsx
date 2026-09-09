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

/**
 * Two fields at different seeds and densities. The point is that the layout is DETERMINISTIC
 * per seed (mulberry32, never `Math.random()`), so the same seed always paints the same field
 * and a screenshot never drifts — and that `count` is clamped, so density is bounded.
 */
export function particleFieldSeeds(): ReactNode {
  return (
    <Wrapper className="grid grid-cols-1 gap-4 p-0 sm:grid-cols-2">
      {[
        { seed: 3, count: 24, label: "seed 3 · 24" },
        { seed: 11, count: 96, label: "seed 11 · 96" },
      ].map((field) => (
        <MarketingSurface
          key={field.seed}
          className="relative overflow-hidden rounded-lg p-6"
        >
          <ParticleField seed={field.seed} count={field.count} />
          <p className="relative font-mono text-mono-label text-muted-foreground uppercase">
            {field.label}
          </p>
        </MarketingSurface>
      ))}
    </Wrapper>
  );
}

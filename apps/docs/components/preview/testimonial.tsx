"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { MarketingSurface } from "@/components/ui/marketing-surface";
import { Testimonial } from "@/components/ui/testimonial";

export function testimonial(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full max-w-lg rounded-lg p-8">
        <Testimonial
          quote="VegaStack cut our design-to-ship time in half — one registry, tokens everywhere."
          name="A. Rivera"
          role="CTO, Example Co."
        />
      </MarketingSurface>
    </Wrapper>
  );
}

export function testimonialNoRole(): ReactNode {
  return (
    <Wrapper className="p-0">
      <MarketingSurface className="w-full max-w-lg rounded-lg p-8">
        <Testimonial quote="It just works." name="J. Chen" />
      </MarketingSurface>
    </Wrapper>
  );
}

"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { RatingBars } from "@/components/ui/rating-bars";

export function ratingBars(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-60 flex-col gap-1.5">
        <RatingBars label="Speed" value={4} valueText="Fast" />
        <RatingBars label="Cost" value={2} valueText="Low" />
        <RatingBars label="Quality" value={5} valueText="Strongest" />
      </div>
    </Wrapper>
  );
}

/** `null` lights no segment: the word says why. */
export function ratingBarsUnknown(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-60 flex-col gap-1.5">
        <RatingBars label="Speed" value={3} valueText="Medium" />
        <RatingBars label="Cost" value={null} valueText="Not listed" />
      </div>
    </Wrapper>
  );
}

/** `default` draws 12×8px segments; `sm` 10×6px ones for a dense panel. */
export function ratingBarsSizes(): ReactNode {
  return (
    <Wrapper>
      <div className="flex w-60 flex-col gap-1.5">
        <RatingBars label="Speed" value={4} valueText="Fast" />
        <RatingBars label="Speed" value={4} valueText="Fast" size="sm" />
      </div>
    </Wrapper>
  );
}

"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/progress` (dogfoods the registry) → auto-scanned.
import { Progress } from "@/components/ui/progress";

// Single determinate bar — primary fill on a muted track.
export function progress(): ReactNode {
  return (
    <Wrapper>
      <Progress value={60} aria-label="Upload progress" className="max-w-xs" />
    </Wrapper>
  );
}

// The fill across the range — 0 / 33 / 66 / 100.
export function progressValues(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Progress value={0} aria-label="0 percent" />
      <Progress value={33} aria-label="33 percent" />
      <Progress value={66} aria-label="66 percent" />
      <Progress value={100} aria-label="100 percent" />
    </Wrapper>
  );
}

// The height scale — sm (6px) / default (8px) / lg (12px).
export function progressSizes(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Progress value={50} size="sm" aria-label="Small" />
      <Progress value={50} size="default" aria-label="Default" />
      <Progress value={50} size="lg" aria-label="Large" />
    </Wrapper>
  );
}

// Custom scale via `max` — step 3 of 5 reports as 60% to assistive tech.
export function progressCustomScale(): ReactNode {
  return (
    <Wrapper>
      <Progress
        value={3}
        max={5}
        size="lg"
        aria-label="Step 3 of 5"
        className="max-w-xs"
      />
    </Wrapper>
  );
}

// Indeterminate — value={null}. Base UI drops aria-valuenow and animates the fill.
export function progressIndeterminate(): ReactNode {
  return (
    <Wrapper>
      <Progress value={null} aria-label="Loading" className="max-w-xs" />
    </Wrapper>
  );
}

// Status-colored fill via `indicatorClassName` — override the default primary.
export function progressColors(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      <Progress
        value={66}
        indicatorClassName="bg-success"
        aria-label="Success fill"
      />
      <Progress
        value={45}
        indicatorClassName="bg-warning"
        aria-label="Warning fill"
      />
      <Progress
        value={20}
        indicatorClassName="bg-destructive"
        aria-label="Destructive fill"
      />
    </Wrapper>
  );
}

// Custom track styling via `trackClassName` — recolor the rail behind the fill.
export function progressTrack(): ReactNode {
  return (
    <Wrapper>
      <Progress
        value={50}
        trackClassName="bg-info-subtle"
        indicatorClassName="bg-info"
        aria-label="Custom track"
        className="max-w-xs"
      />
    </Wrapper>
  );
}

// Size × value matrix — the two axes are independent.
export function progressMatrix(): ReactNode {
  const sizes = ["sm", "default", "lg"] as const;
  const values = [25, 60, 100];
  return (
    <Wrapper className="flex-col items-stretch gap-4">
      {sizes.map((size) => (
        <div key={size} className="flex flex-col gap-2">
          <span className="text-sm text-muted-foreground">{size}</span>
          {values.map((value) => (
            <Progress
              key={value}
              size={size}
              value={value}
              aria-label={`${size} ${value} percent`}
            />
          ))}
        </div>
      ))}
    </Wrapper>
  );
}

// `render` composition — swap the progressbar root element while keeping
// Base UI's accessible semantics, slots, and the Track/Indicator children.
export function progressRender(): ReactNode {
  return (
    <Wrapper>
      <Progress
        value={60}
        aria-label="Upload progress"
        className="max-w-xs"
        render={<output />}
      />
    </Wrapper>
  );
}

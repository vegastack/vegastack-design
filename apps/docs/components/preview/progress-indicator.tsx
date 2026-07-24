"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/progress-indicator` (dogfoods the registry) → auto-scanned.
import { ProgressIndicator } from "@/components/ui/progress-indicator";
import { Button } from "@/components/ui/button";

export function progressIndicator(): ReactNode {
  return (
    <Wrapper>
      <ProgressIndicator value={60} />
    </Wrapper>
  );
}

export function progressIndicatorValues(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <ProgressIndicator value={0} aria-label="0 percent" />
      <ProgressIndicator value={25} aria-label="25 percent" />
      <ProgressIndicator value={50} aria-label="50 percent" />
      <ProgressIndicator value={75} aria-label="75 percent" />
      <ProgressIndicator value={100} aria-label="100 percent" />
    </Wrapper>
  );
}

export function progressIndicatorShapes(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <ProgressIndicator
        value={60}
        shape="circle"
        aria-label="Circle 60 percent"
      />
      <ProgressIndicator
        value={60}
        shape="squircle"
        aria-label="Squircle 60 percent"
      />
    </Wrapper>
  );
}

export function progressIndicatorSizes(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <ProgressIndicator value={66} size="xs" aria-label="Extra small" />
      <ProgressIndicator value={66} size="sm" aria-label="Small" />
      <ProgressIndicator value={66} size="default" aria-label="Default" />
      <ProgressIndicator value={66} size="lg" aria-label="Large" />
    </Wrapper>
  );
}

export function progressIndicatorColors(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <ProgressIndicator value={70} aria-label="Primary" />
      <ProgressIndicator
        value={70}
        className="text-success-text"
        aria-label="Success"
      />
      <ProgressIndicator
        value={70}
        className="text-warning-text"
        aria-label="Warning"
      />
      <ProgressIndicator
        value={70}
        className="text-destructive-text"
        aria-label="Destructive"
      />
    </Wrapper>
  );
}

export function progressIndicatorCustomScale(): ReactNode {
  return (
    <Wrapper className="gap-6">
      <ProgressIndicator value={1} max={5} aria-label="Step 1 of 5" />
      <ProgressIndicator value={3} max={5} aria-label="Step 3 of 5" />
      <ProgressIndicator value={5} max={5} aria-label="Step 5 of 5" />
    </Wrapper>
  );
}

export function progressIndicatorSweep(): ReactNode {
  const steps = [10, 45, 80, 25];
  const [i, setI] = useState(0);
  return (
    <Wrapper className="flex-col gap-4">
      <ProgressIndicator
        value={steps[i]}
        size="lg"
        aria-label={`${steps[i]}% complete`}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => setI((prev) => (prev + 1) % steps.length)}
      >
        Change value
      </Button>
    </Wrapper>
  );
}

export function progressIndicatorShapeValueMatrix(): ReactNode {
  const values = [0, 25, 50, 75, 100];
  const shapes = ["circle", "squircle"] as const;
  return (
    <Wrapper>
      <div className="grid grid-cols-5 gap-6">
        {shapes.map((shape) =>
          values.map((value) => (
            <ProgressIndicator
              key={`${shape}-${value}`}
              value={value}
              shape={shape}
              size="lg"
              aria-label={`${shape} ${value} percent`}
            />
          )),
        )}
      </div>
    </Wrapper>
  );
}
export function progressIndicatorSegments(): ReactNode {
  // Dash-segment mode: step counts, not smooth percentages.
  return (
    <Wrapper className="items-center gap-8">
      <ProgressIndicator
        segments={6}
        value={2}
        max={6}
        aria-label="2 of 6 steps complete"
      />
      <ProgressIndicator
        segments={4}
        value={4}
        max={4}
        size="lg"
        className="text-success-text"
        aria-label="Setup complete"
      />
      <ProgressIndicator
        segments={5}
        value={0}
        max={5}
        size="sm"
        aria-label="Not started"
      />
    </Wrapper>
  );
}

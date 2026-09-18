"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/slider` (dogfoods the registry) → auto-scanned.
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

export function slider(): ReactNode {
  return (
    <Wrapper>
      <Slider
        defaultValue={[33]}
        max={100}
        step={1}
        aria-label="Value"
        className="mx-auto w-full max-w-xs"
      />
    </Wrapper>
  );
}

export function sliderRange(): ReactNode {
  return (
    <Wrapper>
      <Slider
        defaultValue={[25, 50]}
        max={100}
        step={5}
        aria-label="Price range"
        className="mx-auto w-full max-w-xs"
      />
    </Wrapper>
  );
}

export function sliderMultipleThumbs(): ReactNode {
  return (
    <Wrapper>
      <Slider
        defaultValue={[10, 20, 70]}
        max={100}
        step={10}
        aria-label="Breakpoints"
        className="mx-auto w-full max-w-xs"
      />
    </Wrapper>
  );
}

export function sliderVertical(): ReactNode {
  return (
    <Wrapper>
      <div className="mx-auto flex w-full max-w-xs items-center justify-center gap-6">
        <Slider
          defaultValue={[50]}
          max={100}
          step={1}
          orientation="vertical"
          aria-label="Left channel"
          className="h-40"
        />
        <Slider
          defaultValue={[25]}
          max={100}
          step={1}
          orientation="vertical"
          aria-label="Right channel"
          className="h-40"
        />
      </div>
    </Wrapper>
  );
}

export function sliderControlled(): ReactNode {
  const [value, setValue] = React.useState([0.3, 0.7]);

  return (
    <Wrapper>
      <div className="mx-auto grid w-full max-w-xs gap-3">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="slider-demo-temperature">Temperature</Label>
          <span className="text-sm text-muted-foreground">
            {value.join(", ")}
          </span>
        </div>
        <Slider
          id="slider-demo-temperature"
          value={value}
          onValueChange={(next) => setValue(next as number[])}
          min={0}
          max={1}
          step={0.1}
        />
      </div>
    </Wrapper>
  );
}

export function sliderDisabled(): ReactNode {
  return (
    <Wrapper>
      <Slider
        defaultValue={[50]}
        max={100}
        step={1}
        disabled
        aria-label="Value"
        className="mx-auto w-full max-w-xs"
      />
    </Wrapper>
  );
}

export function sliderRtl(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      <Slider
        defaultValue={[75]}
        max={100}
        step={1}
        dir="ltr"
        aria-label="Left to right"
        className="mx-auto w-full max-w-xs"
      />
      <Slider
        defaultValue={[75]}
        max={100}
        step={1}
        dir="rtl"
        aria-label="من اليمين إلى اليسار"
        className="mx-auto w-full max-w-xs"
      />
    </Wrapper>
  );
}

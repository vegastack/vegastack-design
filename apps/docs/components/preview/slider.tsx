"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/slider` (dogfoods the registry) → auto-scanned.
import { Slider } from "@/components/ui/slider";

/** Single value — one thumb, `bg-primary` fill. */
export function slider(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64">
        <Slider defaultValue={40} aria-label="Volume" />
      </div>
    </Wrapper>
  );
}

/** Range — two thumbs, the `bg-primary` fill spans the selected band. */
export function sliderRange(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64">
        <Slider
          defaultValue={[20, 80]}
          thumbAriaLabels={["Minimum price", "Maximum price"]}
        />
      </div>
    </Wrapper>
  );
}

/** Stepped — snaps to `step`, here 0–1000 by 50. */
export function sliderSteps(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64">
        <Slider
          defaultValue={500}
          min={0}
          max={1000}
          step={50}
          aria-label="Budget"
        />
      </div>
    </Wrapper>
  );
}

/** Disabled — dimmed, not interactive. */
export function sliderDisabled(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64">
        <Slider defaultValue={40} disabled aria-label="Disabled" />
      </div>
    </Wrapper>
  );
}

/** Disabled range — both thumbs dimmed and dropped from the tab order. */
export function sliderDisabledRange(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64">
        <Slider
          defaultValue={[20, 80]}
          disabled
          thumbAriaLabels={["Minimum price", "Maximum price"]}
        />
      </div>
    </Wrapper>
  );
}

/**
 * Dynamic thumb names — `getThumbAriaLabel` builds each accessible name from the
 * thumb's index and current value, the callback alternative to the static
 * `thumbAriaLabels` array. Here each thumb announces its own price.
 */
export function sliderThumbAriaLabel(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64">
        <Slider
          defaultValue={[20, 80]}
          min={0}
          max={100}
          getThumbAriaLabel={(index, value) =>
            `${index === 0 ? "Minimum" : "Maximum"} price, $${value ?? 0}`
          }
        />
      </div>
    </Wrapper>
  );
}

/** Controlled — value mirrored back from React state. */
export function sliderControlled(): ReactNode {
  return <ControlledSlider />;
}

function ControlledSlider(): ReactNode {
  const [value, setValue] = useState<number | readonly number[]>(60);
  const display = Array.isArray(value) ? value.join(" – ") : value;
  return (
    <Wrapper>
      <div className="flex w-64 flex-col gap-2">
        <span className="font-mono text-base text-muted-foreground">
          {display}
        </span>
        <Slider
          value={value}
          onValueChange={setValue}
          aria-label="Brightness"
        />
      </div>
    </Wrapper>
  );
}

/** Tick marks — `aria-hidden` decoration that makes a stepped range legible. */
export function sliderMarks(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64">
        <Slider
          defaultValue={4}
          min={0}
          max={10}
          step={1}
          marks
          aria-label="Rating"
        />
      </div>
    </Wrapper>
  );
}

/** Floating value readout — appears on drag and on keyboard focus only. */
export function sliderShowValue(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64 pt-8">
        <Slider defaultValue={40} showValue aria-label="Opacity" />
      </div>
    </Wrapper>
  );
}

/** Vertical — the rail runs bottom-to-top and the arrow keys follow it. */
export function sliderVertical(): ReactNode {
  return (
    <Wrapper>
      <div className="h-40">
        <Slider orientation="vertical" defaultValue={60} aria-label="Volume" />
      </div>
    </Wrapper>
  );
}

/**
 * The `media` variant with `thumb="hover"` — the seek treatment the players use:
 * a thicker rail on engagement, and a thumb hidden at rest ONLY where a pointer
 * can hover (on touch it stays visible, or there is no scrub affordance at all).
 */
export function sliderMedia(): ReactNode {
  return (
    <Wrapper>
      <div className="w-64">
        <Slider
          variant="media"
          thumb="hover"
          defaultValue={35}
          aria-label="Seek"
        />
      </div>
    </Wrapper>
  );
}

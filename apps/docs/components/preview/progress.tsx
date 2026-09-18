"use client";

import * as React from "react";
import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/progress` (dogfoods the registry) → auto-scanned.
import { DirectionProvider } from "@/components/ui/direction";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";

/*
 * Fixtures come from upstream's own examples in `vendor/shadcn/4.21.0/docs/progress.md`. Upstream's
 * hero animates 13 → 66 through a `setTimeout`; the geometry lane mounts these fixtures, so the
 * value is pinned at 66 instead — the bar upstream's demo settles on, with no timer.
 */

export function progress(): ReactNode {
  return (
    <Wrapper>
      <Progress value={66} className="w-[60%]" aria-label="Task progress" />
    </Wrapper>
  );
}

/**
 * Upstream's Composition example: `ProgressLabel` and `ProgressValue` are the children, and
 * `Progress` renders the `ProgressTrack`/`ProgressIndicator` pair itself underneath them.
 */
export function progressComposition(): ReactNode {
  return (
    <Wrapper>
      <Progress value={56} className="w-full max-w-sm">
        <ProgressLabel>Upload progress</ProgressLabel>
        <ProgressValue />
      </Progress>
    </Wrapper>
  );
}

export function progressLabel(): ReactNode {
  return (
    <Wrapper>
      <Progress value={56} className="w-full max-w-sm">
        <ProgressLabel>Upload progress</ProgressLabel>
        <ProgressValue />
      </Progress>
    </Wrapper>
  );
}

export function progressControlled(): ReactNode {
  return (
    <Wrapper>
      <ProgressControlledDemo />
    </Wrapper>
  );
}

function ProgressControlledDemo() {
  const [value, setValue] = React.useState(50);

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <Progress value={value} className="w-full" aria-label="Task progress" />
      {/* The value is an ARRAY even for a single thumb: upstream's `Slider` derives its thumb
          count from `Array.isArray(value) ? value : … : [min, max]`, so a scalar falls through to
          the two-thumb range default and renders two overlapping thumbs. */}
      <Slider
        value={[value]}
        onValueChange={(next) => setValue((next as number[])[0] ?? 0)}
        min={0}
        max={100}
        step={1}
        aria-label="Task progress"
      />
    </div>
  );
}

/**
 * Upstream drives its RTL example through a `language-selector` fixture we do not ship, so the
 * Arabic string and the numeral mapping are inline and the subtree is wrapped in
 * `DirectionProvider`. `ProgressValue` takes a render function, which is how the formatted value
 * is replaced without touching the component.
 */
const ARABIC_NUMERALS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

function toArabicNumerals(num: number): string {
  return num
    .toString()
    .split("")
    .map((digit) => ARABIC_NUMERALS[parseInt(digit, 10)])
    .join("");
}

export function progressRtl(): ReactNode {
  return (
    <DirectionProvider direction="rtl">
      <Wrapper dir="rtl">
        <Progress value={56} className="w-full max-w-sm">
          <ProgressLabel>تقدم الرفع</ProgressLabel>
          <ProgressValue>
            {(value) => (
              <span className="ms-auto">
                {toArabicNumerals(parseFloat(value ?? "0"))}%
              </span>
            )}
          </ProgressValue>
        </Progress>
      </Wrapper>
    </DirectionProvider>
  );
}

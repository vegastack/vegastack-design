"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import { Bold, Italic, Underline } from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/toggle` (dogfoods the registry) → auto-scanned.
import { Toggle } from "@/components/ui/toggle";

export function toggle(): ReactNode {
  return (
    <Wrapper>
      <Toggle aria-label="Toggle bold">
        <Bold />
      </Toggle>
    </Wrapper>
  );
}

export function toggleSizesAndStates(): ReactNode {
  return (
    <Wrapper className="flex-col items-stretch gap-6">
      {/* Sizes — 28 / 32 / 40 (sm / default / lg), with a text label. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Toggle size="sm" aria-label="Small underline">
          <Underline />
          Small
        </Toggle>
        <Toggle size="default" aria-label="Default bold">
          <Bold />
          Default
        </Toggle>
        <Toggle size="lg" aria-label="Large italic">
          <Italic />
          Large
        </Toggle>
      </div>

      {/* States — off, on (pressed), and disabled. */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Toggle aria-label="Bold, off">
          <Bold />
          Off
        </Toggle>
        <Toggle defaultPressed aria-label="Bold, on">
          <Bold />
          On
        </Toggle>
        <Toggle disabled aria-label="Bold, disabled">
          <Bold />
          Disabled
        </Toggle>
        <Toggle disabled defaultPressed aria-label="Bold, disabled on">
          <Bold />
          Disabled on
        </Toggle>
      </div>
    </Wrapper>
  );
}

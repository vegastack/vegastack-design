"use client";

import type { ReactNode } from "react";
import { Wrapper } from "./wrapper";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from "lucide-react";
// Copied INTO apps/docs via `shadcn add @vegastack/toggle-group` (dogfoods the registry) → auto-scanned.
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export function toggleGroup(): ReactNode {
  // Single-select (radio-like): exactly one item is pressed; the selected item fills an evident neutral grey (bg-foreground/(--alpha-ink-tint)).
  return (
    <Wrapper className="flex-col items-center gap-6">
      <ToggleGroup defaultValue={["center"]} aria-label="Text alignment">
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* A second group showing a disabled item. */}
      <ToggleGroup
        defaultValue={["center"]}
        aria-label="Text alignment, with disabled item"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right" disabled>
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupMultiple(): ReactNode {
  // Multi-select (checkbox-like): any number of items can be pressed; each selected item fills an evident neutral grey (bg-foreground/(--alpha-ink-tint)).
  return (
    <Wrapper className="flex-col items-center gap-6">
      <ToggleGroup
        multiple
        defaultValue={["bold", "underline"]}
        aria-label="Text formatting"
      >
        <ToggleGroupItem value="bold" aria-label="Bold">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <Italic />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <Underline />
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Sizes — 28 / 32 / 40 (sm / default / lg). */}
      <ToggleGroup
        multiple
        defaultValue={["bold"]}
        size="sm"
        aria-label="Formatting, small"
      >
        <ToggleGroupItem value="bold" aria-label="Bold">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <Italic />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <Underline />
        </ToggleGroupItem>
      </ToggleGroup>
      <ToggleGroup
        multiple
        defaultValue={["italic"]}
        size="lg"
        aria-label="Formatting, large"
      >
        <ToggleGroupItem value="bold" aria-label="Bold">
          <Bold />
        </ToggleGroupItem>
        <ToggleGroupItem value="italic" aria-label="Italic">
          <Italic />
        </ToggleGroupItem>
        <ToggleGroupItem value="underline" aria-label="Underline">
          <Underline />
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupSizes(): ReactNode {
  // `size` set once on the root flows to every item — sm (28) / default (32) / lg (40).
  return (
    <Wrapper className="flex-col items-center gap-6">
      <ToggleGroup
        defaultValue={["center"]}
        size="sm"
        aria-label="Text alignment, small"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        defaultValue={["center"]}
        aria-label="Text alignment, default"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>

      <ToggleGroup
        defaultValue={["center"]}
        size="lg"
        aria-label="Text alignment, large"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupVertical(): ReactNode {
  // `orientation="vertical"` stacks items into a column; the outer corners round
  // the top of the first item and the bottom of the last.
  return (
    <Wrapper className="flex-col items-center gap-6">
      <ToggleGroup
        orientation="vertical"
        defaultValue={["left"]}
        aria-label="Text alignment, vertical"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

export function toggleGroupDisabled(): ReactNode {
  // A disabled whole group — `disabled` on the root flows to every item, dimming
  // the group and skipping it for pointer + keyboard interaction.
  return (
    <Wrapper className="flex-col items-center gap-6">
      <ToggleGroup
        disabled
        defaultValue={["center"]}
        aria-label="Text alignment, disabled"
      >
        <ToggleGroupItem value="left" aria-label="Align left">
          <AlignLeft />
        </ToggleGroupItem>
        <ToggleGroupItem value="center" aria-label="Align center">
          <AlignCenter />
        </ToggleGroupItem>
        <ToggleGroupItem value="right" aria-label="Align right">
          <AlignRight />
        </ToggleGroupItem>
      </ToggleGroup>
    </Wrapper>
  );
}

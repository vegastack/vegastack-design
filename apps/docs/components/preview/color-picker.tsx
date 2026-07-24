"use client";

import { useState, type ReactNode } from "react";
import { Wrapper } from "./wrapper";
// Copied INTO apps/docs via `shadcn add @vegastack/color-picker` (dogfoods the registry) → auto-scanned.
import { ColorPicker, type ColorOption } from "@/components/ui/color-picker";

/**
 * Interactive — click the `rounded-md` trigger to open the swatch grid. The chosen
 * swatch shows a check + `border-primary`; the trigger mirrors the current color.
 */
export function colorPicker(): ReactNode {
  const [color, setColor] = useState("blue");
  return (
    <Wrapper>
      <ColorPicker value={color} onValueChange={setColor} />
    </Wrapper>
  );
}

/** Trigger states — selected, empty (no selection), and disabled. */
export function colorPickerStates(): ReactNode {
  const [color, setColor] = useState("rose");
  return (
    <Wrapper className="gap-6">
      {/* Selected — trigger renders the chosen color; opening it marks rose with `border-primary`. */}
      <ColorPicker
        value={color}
        onValueChange={setColor}
        aria-label="Label color"
      />
      {/* Empty — no selection yet (transparent trigger fill). */}
      <ColorPicker value="" onValueChange={() => {}} aria-label="Unset color" />
      {/* Disabled — trigger and swatches non-interactive. */}
      <ColorPicker
        value="green"
        onValueChange={() => {}}
        disabled
        aria-label="Locked color"
      />
    </Wrapper>
  );
}

/**
 * Custom palette + `columns` — a curated 3-color, semantic-token palette laid out in a
 * 3-wide grid (`columns={3}` drives the dynamic `--swatch-cols` grid template).
 */
const TAG_COLORS: ColorOption[] = [
  { name: "info", label: "Info", color: "var(--color-info)" },
  { name: "accent", label: "Accent", color: "var(--color-accent)" },
  { name: "danger", label: "Danger", color: "var(--color-destructive)" },
];

export function colorPickerCustomPalette(): ReactNode {
  const [color, setColor] = useState("info");
  return (
    <Wrapper>
      <ColorPicker
        value={color}
        onValueChange={setColor}
        colors={TAG_COLORS}
        columns={3}
        aria-label="Tag color"
      />
    </Wrapper>
  );
}

/**
 * `columns` matrix — the same default 12-color palette rendered at three grid widths
 * (`columns={4}`, the default `7`, and `12`) so the dynamic `--swatch-cols` layout is visible.
 */
export function colorPickerColumns(): ReactNode {
  const [color, setColor] = useState("teal");
  return (
    <Wrapper className="gap-6">
      {/* 4 columns — taller grid. */}
      <ColorPicker
        value={color}
        onValueChange={setColor}
        columns={4}
        aria-label="4-column palette"
      />
      {/* Default 7 columns. */}
      <ColorPicker
        value={color}
        onValueChange={setColor}
        columns={7}
        aria-label="7-column palette"
      />
      {/* 12 columns — single row. */}
      <ColorPicker
        value={color}
        onValueChange={setColor}
        columns={12}
        aria-label="12-column palette"
      />
    </Wrapper>
  );
}

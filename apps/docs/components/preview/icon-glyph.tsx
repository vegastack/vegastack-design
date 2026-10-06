"use client";
import type { ReactNode } from "react";
import { IconGlyph } from "@/components/ui/icon-glyph";
import { Wrapper } from "./wrapper";
/** Generic outline, emoji and initial glyphs. */
export function iconGlyph(): ReactNode {
  return (
    <Wrapper>
      <IconGlyph
        value={{ kind: "icon", name: "briefcase-business" }}
        hue="blue"
      />
      <IconGlyph value={{ kind: "emoji", char: "🚀" }} />
      <IconGlyph fallback="S" />
    </Wrapper>
  );
}

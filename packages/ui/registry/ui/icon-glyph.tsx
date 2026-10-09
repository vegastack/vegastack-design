// @vegastack icon-glyph@0.25.1 sha256-JUbpJgqhtQxS84jf/SFQBQ8kuKnY5nNdqVYayrdcCtA=

import * as React from "react";
import { cn } from "@vegastack/design";
import { ICON_COMPONENTS } from "@/lib/icon-components";
import type { IconValue } from "@/lib/icon-data";
import type { AvatarHue } from "@/components/ui/avatar";

const HUES: Record<AvatarHue, string> = {
  blue: "text-tag-blue-text",
  cyan: "text-tag-cyan-text",
  green: "text-tag-green-text",
  lime: "text-tag-lime-text",
  yellow: "text-tag-yellow-text",
  orange: "text-tag-orange-text",
  red: "text-tag-red-text",
  pink: "text-tag-pink-text",
  magenta: "text-tag-magenta-text",
  purple: "text-tag-purple-text",
};
const SIZES = {
  xs: "size-4 text-xs [&_svg]:size-4",
  sm: "size-5 text-sm [&_svg]:size-5",
  default: "size-6 text-lg [&_svg]:size-6",
  lg: "size-8 text-2xl [&_svg]:size-8",
} as const;
/** A generic identity glyph with no entity, access or avatar semantics. */
export interface IconGlyphProps extends React.ComponentPropsWithRef<"span"> {
  /** Chosen catalogue icon or natural emoji. @default null */
  value?: IconValue | null;
  /**
   * Hue for outline icons or fallback text; emoji retain their own colours. Without one the glyph
   * takes the sidebar nav icon ink (`sidebar-foreground` at 70%).
   * @default undefined
   */
  hue?: AvatarHue | null;
  /** Glyph scale. @default "xs" */
  size?: keyof typeof SIZES;
  /** Content shown when no known icon is available. @default undefined */
  fallback?: React.ReactNode;
}
/** Render an icon, emoji or fallback without loading interactive picker code.
 * @example <IconGlyph value={{ kind: "icon", name: "briefcase-business" }} hue="blue" />
 */
export function IconGlyph({
  value,
  hue,
  size = "xs",
  fallback,
  className,
  ...props
}: IconGlyphProps) {
  const Glyph =
    value?.kind === "icon" ? ICON_COMPONENTS[value.name] : undefined;
  return (
    <span
      data-slot="icon-glyph"
      data-size={size}
      data-icon-tone=""
      aria-hidden={props["aria-label"] ? undefined : true}
      role={props["aria-label"] ? "img" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center leading-none [&_svg]:shrink-0",
        SIZES[size],
        // No hue: the sidebar nav icon's ink, never full foreground, so an uncoloured space or
        // record icon sits at the same weight as the navigation icons beside it.
        value?.kind !== "emoji" && hue
          ? HUES[hue]
          : "text-sidebar-foreground/70",
        className,
      )}
      {...props}
    >
      {value?.kind === "emoji" ? (
        value.char
      ) : Glyph ? (
        <Glyph aria-hidden data-icon-tone="" />
      ) : (
        fallback
      )}
    </span>
  );
}

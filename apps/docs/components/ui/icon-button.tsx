// @vegastack icon-button@0.4.1 sha256-RI8DGr463PVYZSV0unbjre1QYv48U2wzYrhHEWCM67E=

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";

/** The four square icon-only sizes, mapped onto `Button`'s `icon-*` size scale. */
export type IconButtonSize = "xs" | "sm" | "default" | "lg";

const sizeMap = {
  xs: "icon-xs",
  sm: "icon-sm",
  default: "icon",
  lg: "icon-lg",
} as const satisfies Record<IconButtonSize, NonNullable<ButtonProps["size"]>>;

/**
 * Props for {@link IconButton}. Inherits every `Button` prop except `size`
 * (remapped to the square `IconButtonSize` scale) and requires an accessible
 * `aria-label` because the icon child carries no text.
 */
export interface IconButtonProps extends Omit<
  ButtonProps,
  "size" | "aria-label"
> {
  /**
   * The icon to render. Pass a single `lucide-react` (or `@vegastack/design/icons`)
   * element — it is sized automatically by the chosen `size`.
   */
  children: React.ReactNode;
  /**
   * Square size — maps to `Button`'s `icon-xs` / `icon-sm` / `icon` / `icon-lg`.
   * @default 'default'
   */
  size?: IconButtonSize;
  /**
   * Accessible name announced to assistive tech (required — the icon has no
   * visible text).
   */
  "aria-label": string;
}

/**
 * `IconButton` — a square, icon-only action button. A thin wrapper over
 * {@link Button} that forces an `icon-*` size and **requires** an accessible
 * `aria-label`, since there is no visible text to name it. Variants, `loading`,
 * `disabled`, and `render` pass straight through.
 *
 * **Why this exists (RETAINED by decision — register P1-21 reversed):** the whole job of the
 * wrapper is the **compile-time accessible-name guarantee**. `Button size="icon"` accepts an
 * unnamed icon-only button silently; `IconButton` makes the missing `aria-label` a TYPE ERROR.
 * Docs previews and app code should reach for `IconButton` for every icon-only case.
 *
 * @example
 * <IconButton aria-label="Add item" variant="outline" size="sm">
 *   <Plus />
 * </IconButton>
 */
export function IconButton({
  size = "default",
  children,
  ...props
}: IconButtonProps) {
  return (
    <Button {...props} size={sizeMap[size]} data-slot="icon-button">
      {children}
    </Button>
  );
}

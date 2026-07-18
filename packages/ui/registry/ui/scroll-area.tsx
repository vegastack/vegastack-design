// @vegastack scroll-area@0.1.0 sha256-S/MGOHw6/XUC5isj/hJQK+1g7sD8OQkC2FLIOA8/otU=

"use client";

import * as React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cn } from "@vegastack/design";

export interface ScrollBarProps extends React.ComponentProps<
  typeof BaseScrollArea.Scrollbar
> {
  /**
   * Which axis the scrollbar controls.
   * @default 'vertical'
   */
  orientation?: "vertical" | "horizontal";
}

/**
 * `ScrollBar` — a single custom scrollbar track + thumb for one axis. Rendered
 * automatically by `ScrollArea`; export it on its own only when composing a
 * custom layout (e.g. a horizontal-only area). Auto-hides when idle and fades
 * in while hovering or scrolling, driven by Base UI's `data-hovering` /
 * `data-scrolling` state attributes.
 */
export function ScrollBar({
  className,
  orientation = "vertical",
  children,
  ...props
}: ScrollBarProps) {
  return (
    <BaseScrollArea.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        // Layout: a thin, non-selecting track inset from the viewport edges.
        "flex touch-none select-none p-px transition-opacity duration-fast ease-standard",
        // Auto-hide: invisible at rest, visible while hovering or scrolling.
        "opacity-0 data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
        // Vertical: a 10px-wide column hugging the right edge.
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:flex-col",
        // Horizontal: a 10px-tall row hugging the bottom edge.
        "data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-row",
        className,
      )}
      {...props}
    >
      {children ?? (
        <BaseScrollArea.Thumb
          data-slot="scroll-area-thumb"
          className="relative flex-1 rounded-full bg-border"
        />
      )}
    </BaseScrollArea.Scrollbar>
  );
}

export interface ScrollAreaProps extends React.ComponentProps<
  typeof BaseScrollArea.Root
> {
  /**
   * Which scrollbar(s) to render. `vertical` (the default) and `horizontal`
   * each render a single axis; `both` renders both plus the intersection
   * corner for dual-axis content.
   * @default 'vertical'
   */
  orientation?: "vertical" | "horizontal" | "both";
  /**
   * Classes for the scroll container. Set the height/width constraints here
   * (e.g. `h-72 w-full`) — without a bounded size the content cannot overflow
   * and no scrollbar appears. The inner viewport fills this box.
   */
  className?: string;
  /**
   * Props applied to the automatically rendered scrollbar(s). Useful for tests
   * or custom visibility policy, e.g. `keepMounted`.
   */
  scrollbarProps?: Omit<ScrollBarProps, "orientation">;
  /** Scrollable content. */
  children?: React.ReactNode;
}

/**
 * `ScrollArea` — a scroll container with custom, auto-hiding scrollbars. Built
 * on Base UI's `ScrollArea`, it composes Root → Viewport → Scrollbar → Thumb
 * (plus a Corner for dual-axis), replacing the native browser scrollbar with a
 * token-styled one that fades in on hover/scroll. Constrain the container via
 * `className` (e.g. `h-72`) so its content can overflow.
 */
export function ScrollArea({
  className,
  children,
  orientation = "vertical",
  scrollbarProps,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ScrollAreaProps) {
  return (
    <BaseScrollArea.Root
      data-slot="scroll-area"
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      <BaseScrollArea.Viewport
        data-slot="scroll-area-viewport"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        className="size-full overscroll-contain rounded-[inherit]"
      >
        {children}
      </BaseScrollArea.Viewport>
      {(orientation === "vertical" || orientation === "both") && (
        <ScrollBar orientation="vertical" {...scrollbarProps} />
      )}
      {(orientation === "horizontal" || orientation === "both") && (
        <ScrollBar orientation="horizontal" {...scrollbarProps} />
      )}
      {orientation === "both" && (
        <BaseScrollArea.Corner data-slot="scroll-area-corner" />
      )}
    </BaseScrollArea.Root>
  );
}

// @vegastack scroll-area@0.3.0 sha256-PKIDchAvFvHz2QSc29qiAU5ZB6Vu1XlTCpldcWanC70=

"use client";

import * as React from "react";
import { ScrollArea as BaseScrollArea } from "@base-ui/react/scroll-area";
import { cn } from "@vegastack/design";

/** Props for one axis-specific custom scrollbar. */
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
 * @example <ScrollBar orientation="horizontal" />
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
        // Vertical: a 10px visual track at inline-end with a 24px invisible target
        // extending inward, so the root's overflow clip never cuts it off.
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2.5 data-[orientation=vertical]:flex-col data-[orientation=vertical]:before:absolute data-[orientation=vertical]:before:inset-y-0 data-[orientation=vertical]:before:end-0 data-[orientation=vertical]:before:w-6 data-[orientation=vertical]:before:content-['']",
        // Horizontal: the same 10px visual / 24px target recipe on the block axis.
        "data-[orientation=horizontal]:h-2.5 data-[orientation=horizontal]:flex-row data-[orientation=horizontal]:before:absolute data-[orientation=horizontal]:before:inset-x-0 data-[orientation=horizontal]:before:bottom-0 data-[orientation=horizontal]:before:h-6 data-[orientation=horizontal]:before:content-['']",
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

/** Props for the scroll viewport and its generated scrollbar axes. */
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
   * @default undefined
   */
  className?: string;
  /**
   * Props applied to the automatically rendered scrollbar(s). Useful for tests
   * or custom visibility policy, e.g. `keepMounted`.
   * @default undefined
   */
  scrollbarProps?: Omit<ScrollBarProps, "orientation">;
  /** Scrollable content. @default undefined */
  children?: React.ReactNode;
}

/**
 * `ScrollArea` — a scroll container with custom, auto-hiding scrollbars. Built
 * on Base UI's `ScrollArea`, it composes Root → Viewport → Scrollbar → Thumb
 * (plus a Corner for dual-axis), replacing the native browser scrollbar with a
 * token-styled one that fades in on hover/scroll. Constrain the container via
 * `className` (e.g. `h-72`) so its content can overflow.
 * @example <ScrollArea aria-label="Release notes" className="h-72">Content</ScrollArea>
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

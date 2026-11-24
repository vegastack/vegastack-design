// @vegastack scroll-area@0.135.0 sha256-48668fUOh9vRjh5qqK12mJ9WJSb/AzwcJPXmlTqaIRI=

"use client";

import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import { cn } from "@vegastack/design";

function ScrollArea({
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  tabIndex,
  viewportRef,
  viewportClassName,
  viewportRender,
  viewportProps,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  viewportRef?: React.Ref<HTMLDivElement>;
  /** Classes for the scrolling element (padding, `flex-col`, overscroll). */
  viewportClassName?: string;
  /**
   * The element the viewport renders as — a `<nav>` for a navigation column — so the scroller is
   * the landmark itself. @default a `<div>`
   */
  viewportRender?: React.ReactElement;
  /** Attributes for the scrolling element (`data-slot`, `aria-*`), spread after the defaults. */
  viewportProps?: React.HTMLAttributes<HTMLElement> & {
    [key: `data-${string}`]: string | undefined;
  };
}) {
  const named = ariaLabel !== undefined || ariaLabelledBy !== undefined;
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        ref={viewportRef}
        data-slot="scroll-area-viewport"
        render={viewportRender}
        className={cn(
          // `relative`: the scroller is the containing block of what it scrolls (BRD-SCR).
          "relative size-full rounded-[inherit] transition-[color,box-shadow]",
          viewportClassName,
        )}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        {...(named && !viewportRender ? { role: "region" } : {})}
        {...(tabIndex !== undefined ? { tabIndex } : {})}
        {...viewportProps}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      data-orientation={orientation}
      orientation={orientation}
      className={cn(
        // BRD-SCR: an overlay bar — it takes no room, shows while the pointer is over the area or it
        // scrolls, and its thumb is the global scrollbar's colour (`--scrollbar-thumb`), so an
        // overlay scroller and a native one look the same.
        "flex touch-none p-0.5 opacity-0 transition-opacity duration-quick select-none data-hovering:opacity-100 data-scrolling:opacity-100 data-horizontal:h-2 data-horizontal:flex-col data-vertical:h-full data-vertical:w-2",
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-full bg-(--scrollbar-thumb) hover:bg-(--scrollbar-thumb-hover)"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };

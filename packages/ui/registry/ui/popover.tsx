// @vegastack popover@0.25.66 sha256-1ALG6Dmqrwo+C/5WPo0m7CPq2L+ajmtXmD6fIfMlbBc=

"use client";

import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { cn } from "@vegastack/design";
import { useInternalThemeScope } from "@vegastack/design/theme-scope";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/** A popover's width: 288px by default, 320 (`md`), 384 within the window (`lg`), or its content's own up to 320 (`fit`). */
const POPOVER_SIZES = {
  default: "w-72",
  md: "w-80",
  lg: "w-96 max-w-[calc(100vw-2rem)]",
  fit: "w-auto max-w-80",
} as const;

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  size = "default",
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  > & {
    /**
     * The popover's width: `default` 288px, `md` 320px, `lg` 384px (never wider than the window
     * less 2rem), `fit` its content's own width up to 320px.
     * @default "default"
     */
    size?: keyof typeof POPOVER_SIZES;
  }) {
  const themeScope = useInternalThemeScope();

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className={cn("isolate z-50", themeScope)}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            POPOVER_SIZES[size],
            "z-50 flex origin-(--transform-origin) flex-col gap-2.5 rounded-lg bg-popover p-2.5 text-sm wrap-break-word text-popover-foreground shadow-md border border-border outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-start-2 data-[side=inline-start]:slide-in-from-end-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className,
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

/**
 * `PopoverBody` — a popover's content that may run long (a list of requests): it scrolls inside
 * the popover from 70% of the window's height, its parts 12px apart.
 */
function PopoverBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-body"
      className={cn(
        "flex max-h-[70vh] min-h-0 flex-col gap-3 overflow-y-auto overscroll-contain",
        className,
      )}
      {...props}
    />
  );
}

/**
 * `PopoverAnchor` — an invisible 0×0 trigger, for a popover opened from elsewhere (a menu item, a
 * shortcut) that still needs a place to appear: put it where the popover should point. Never a
 * tab stop, hidden from assistive technology.
 */
function PopoverAnchor({
  className,
  render,
  ...props
}: Omit<PopoverPrimitive.Trigger.Props, "nativeButton">) {
  // The hidden, untabbable 0×0 box is the anchor's whole point: it holds whatever `render` is.
  return (
    <PopoverPrimitive.Trigger
      data-slot="popover-anchor"
      nativeButton={false}
      aria-hidden
      tabIndex={-1}
      className={cn("pointer-events-none absolute size-0", className)}
      render={render ?? <span />}
      {...props}
    />
  );
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-0.5 text-sm", className)}
      {...props}
    />
  );
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("font-medium", className)}
      {...props}
    />
  );
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      // Line breaks in the text are kept (a quoted message); a `strong` is in the foreground ink.
      className={cn(
        "whitespace-pre-line text-muted-foreground [&_strong]:font-medium [&_strong]:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export {
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
};

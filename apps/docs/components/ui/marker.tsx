// @vegastack marker@0.16.0 sha256-RKq+esYIganXESmApfhgiPRVAmN4oIw5UltwDX2UoXQ=

"use client";

import * as React from "react";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

const markerVariants = cva(
  [
    "group/marker relative flex min-h-4 w-full items-center gap-2 text-start text-sm text-muted-foreground [&_svg:not([class*='size-'])]:size-4 [a]:underline [a]:underline-offset-3 [a]:hover:text-foreground",
    // A11Y-2: upstream's own "Links and Buttons" example renders the ROOT as an `<a>` or a
    // `<button>` through `render`. The visible row is then one line of 14px text over `min-h-4`
    // — measured 20px tall, 4px under SC 2.5.8's floor — and a marker row is a control, not
    // prose, so the inline-text exception does not reach it. An invisible `::after` grows the
    // pointer target on the BLOCK axis only, and only when the root really is interactive, so a
    // presentational marker is untouched and two stacked markers never fight for a pixel.
    // Nothing moves and nothing paints. `marker.test.tsx` measures both shapes.
    "[a,button]:after:absolute [a,button]:after:inset-x-0 [a,button]:after:-inset-y-1 [a,button]:after:content-['']",
  ],
  {
    variants: {
      variant: {
        default: "",
        separator:
          "before:me-1 before:h-px before:min-w-0 before:flex-1 before:bg-border after:ms-1 after:h-px after:min-w-0 after:flex-1 after:bg-border",
        border: "border-b border-border pb-2",
      },
    },
  },
);

function Marker({
  className,
  variant = "default",
  render,
  ...props
}: useRender.ComponentProps<"div"> & VariantProps<typeof markerVariants>) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(markerVariants({ variant, className })),
      },
      props,
    ),
    render,
    state: {
      slot: "marker",
      variant,
    },
  });
}

function MarkerIcon({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-icon"
      aria-hidden="true"
      className={cn(
        "size-4 shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function MarkerContent({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="marker-content"
      className={cn(
        "min-w-0 wrap-break-word group-data-[variant=separator]/marker:flex-none group-data-[variant=separator]/marker:text-center *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Marker, MarkerIcon, MarkerContent, markerVariants };

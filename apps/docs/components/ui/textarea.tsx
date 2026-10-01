// @vegastack textarea@0.23.98 sha256-PSs56mxyWd81rfDlVlIh5uAVP7gP9xXe3V+0tloWB/E=

"use client";

import * as React from "react";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { cn } from "@vegastack/design";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <FieldPrimitive.Control
      render={<textarea />}
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-[color,background-color,border-color] duration-150 ease-out outline-hidden placeholder:text-muted-foreground focus:not-aria-invalid:border-ring/40 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50",
        className,
      )}
      {...(props as FieldPrimitive.Control.Props)}
    />
  );
}

export { Textarea };

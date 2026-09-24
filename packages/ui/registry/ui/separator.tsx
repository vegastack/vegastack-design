// @vegastack separator@0.17.1 sha256-X0ARgeEy/W+zTBKg28XEuNKldadVyHwfTgtPcrw0pII=

"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "@vegastack/design";

function Separator({
  className,
  orientation = "horizontal",
  ...props
}: SeparatorPrimitive.Props) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };

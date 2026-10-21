// @vegastack separator@0.25.66 sha256-NB9+mGvz1WOLryf7CncFd7OtZ79xrfZBvYwHBgdku0U=

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

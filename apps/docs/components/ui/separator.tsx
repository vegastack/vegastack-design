// @vegastack separator@0.25.32 sha256-UCfDiwjoerUCTO8GKCcNMHpz1ZVKH0onDom4LiT66Ow=

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

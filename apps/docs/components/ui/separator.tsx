// @vegastack separator@0.23.102 sha256-ggImmVzhrah2fbcFo+W7z5XX3gbv3bXQRU8zKvMdIsA=

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

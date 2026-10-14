// @vegastack skeleton@0.25.31 sha256-arVOiRkuFM4EdDZTOBCmIli+LYPxK2tdmyEymxTa4og=

import { cn } from "@vegastack/design";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

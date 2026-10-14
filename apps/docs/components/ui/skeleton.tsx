// @vegastack skeleton@0.25.33 sha256-P6Ff0B7vPS770T0RTcav60i9Zya2pHwB7KRPY3Iw4c0=

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

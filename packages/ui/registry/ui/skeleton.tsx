// @vegastack skeleton@0.24.3 sha256-nqaqAmEoHzULBmQBBPbWYOHEfuonSro84VGWK6zWUgM=

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

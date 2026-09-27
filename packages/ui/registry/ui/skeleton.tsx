// @vegastack skeleton@0.23.58 sha256-vO7SsiuHfCXpVOsrBxDMPOmE7oXKrtzyOwhA5ljBVSM=

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

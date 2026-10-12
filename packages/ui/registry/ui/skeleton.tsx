// @vegastack skeleton@0.25.23 sha256-LkOOBpWzGpS8lNKjTqlRxA2O5UdDP/iL/VhRPAfW9Lw=

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

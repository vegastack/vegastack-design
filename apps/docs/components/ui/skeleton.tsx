// @vegastack skeleton@0.23.120 sha256-4cfCq1NikREFUrpKyNyGyu9OEL4dp37uKSqj2p/2Z0k=

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

// @vegastack skeleton@0.23.117 sha256-aJ53gCzplV48Ix5PeTcM2SCPxaX40hp0qV1eRP6MZuM=

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

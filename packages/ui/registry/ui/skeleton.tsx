// @vegastack skeleton@0.25.0 sha256-7eD6LPmgmFylCo2RwDs3gqImVpj7tMpUE39Cvmp/amI=

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

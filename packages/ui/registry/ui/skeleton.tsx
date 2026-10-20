// @vegastack skeleton@0.25.51 sha256-0/MNk+kRDjo91+hJdD9Adsbgg6W6JG9nOAF78vZwGoE=

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

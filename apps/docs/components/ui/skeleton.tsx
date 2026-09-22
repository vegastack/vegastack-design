// @vegastack skeleton@0.11.2 sha256-O1goTxPBykyy6kChP194IFCAC7U8LmJ7YZH+UYBNnD8=

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

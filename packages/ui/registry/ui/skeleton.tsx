// @vegastack skeleton@0.24.1 sha256-pSqN5n4xVSuprLEAmsMbhj/dO1bNT179OHpSX5lDvXU=

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

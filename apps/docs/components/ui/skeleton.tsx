// @vegastack skeleton@0.23.92 sha256-h+UgiwSf87LVCC5eVTgmdseUsW75n0FwpXnLiolCNdk=

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

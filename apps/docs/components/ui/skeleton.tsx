// @vegastack skeleton@0.23.0 sha256-1SH2hENX0jwUSRCNL1LUzMyQl/OGOPpMTqVkD6Dtb9w=

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

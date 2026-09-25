// @vegastack skeleton@0.23.13 sha256-N4589uYjPuVGxcYRegF86gJM+2oM7iGE6e6s/+JTVBY=

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

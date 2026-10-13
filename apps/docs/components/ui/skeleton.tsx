// @vegastack skeleton@0.25.30 sha256-TN1riwrecsfA0BaNJmf2ax4onzO7GR+ZceP6+l+ais0=

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

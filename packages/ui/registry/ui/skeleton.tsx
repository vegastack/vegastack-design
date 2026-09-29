// @vegastack skeleton@0.23.76 sha256-pvk3jbMKbaC3Z5j+QMcgQpUVOrwEIWvHHy6uxN04Aqc=

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

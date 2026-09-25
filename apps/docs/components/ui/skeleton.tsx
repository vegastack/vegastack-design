// @vegastack skeleton@0.23.20 sha256-IjDApYjIyd10sh1CBrs96+73OF/fET3BU6LyuwtEOCs=

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

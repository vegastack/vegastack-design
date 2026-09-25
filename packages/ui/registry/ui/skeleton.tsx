// @vegastack skeleton@0.23.29 sha256-HB2syEuHjYGRm3gQvMhM5qBikgNjdpp8BtgThXs4cFQ=

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

// @vegastack skeleton@0.15.0 sha256-xHKsnnXpKufxoFglZrNYC3AssLCqAZ7+bVzIrRkmzUU=

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

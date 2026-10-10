// @vegastack skeleton@0.25.9 sha256-c2WDcTpDgaPcyBARso0g28NH92VbY9U17d1DeqsbR2o=

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

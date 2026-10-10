// @vegastack skeleton@0.25.12 sha256-nj7D9paQpde6wxdEbmRVsCHatPlAWno7bZdSsSV4QEE=

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

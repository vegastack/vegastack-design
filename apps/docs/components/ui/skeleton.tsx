// @vegastack skeleton@0.23.63 sha256-WvAG91dZS0ZEAIwAPTcofv+PAxgA8rvPjRq8p61Sxlo=

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

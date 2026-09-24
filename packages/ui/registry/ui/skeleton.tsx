// @vegastack skeleton@0.20.0 sha256-Q8CBNTJM5I9rINn8ZysErOWXOpiEqTlY4wZmT84fv6E=

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

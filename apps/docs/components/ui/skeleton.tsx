// @vegastack skeleton@0.24.0 sha256-Mx1SmB1MSAEAAFBAG86LKW1UdecB1szrjHqX8jP0qg0=

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

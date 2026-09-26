// @vegastack skeleton@0.23.44 sha256-z0Xn38EP+21WTCZfJkWbpRAU2pEwfafohwHbqx91DDk=

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

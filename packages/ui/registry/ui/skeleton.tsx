// @vegastack skeleton@0.23.31 sha256-tEw561FOz2Bkw8OA054zvLbTHXexdwk8YutlbKqpnxI=

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

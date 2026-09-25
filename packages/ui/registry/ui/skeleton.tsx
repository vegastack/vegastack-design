// @vegastack skeleton@0.23.27 sha256-l4xjo+8LQd5eYd/RSL4HHm/VwwKITZgFztZYFIouHcI=

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

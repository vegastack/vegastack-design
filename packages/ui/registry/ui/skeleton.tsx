// @vegastack skeleton@0.25.54 sha256-DtZtnMYCZzFd1cm7NxyzBZ5u1NabW0nrwmvzh+k+gUs=

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

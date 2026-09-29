// @vegastack skeleton@0.23.74 sha256-dBYhpk7+97d11W0GE7RdZQKkV9tiIyuFSSg8+amLFRo=

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

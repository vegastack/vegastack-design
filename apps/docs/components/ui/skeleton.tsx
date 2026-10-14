// @vegastack skeleton@0.25.39 sha256-GBOR/On4kqoBzz7LtQNrX6fqrkTZkmB6+qhzy35VQiY=

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

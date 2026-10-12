// @vegastack skeleton@0.25.25 sha256-L4bS5qdXydJgHiX2Cg3ZpC3KL4/c96yET+UWq7aFh74=

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

// @vegastack skeleton@0.23.22 sha256-hneLKqZVxqQMQUC5UB6ptcf6qXYm2nbkQ9oIgPm0pDs=

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

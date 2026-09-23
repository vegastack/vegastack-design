// @vegastack skeleton@0.16.0 sha256-OMkIB/JG9CqkAmqg4eSIjZtjMvpr35/4QT1gEnajEuU=

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

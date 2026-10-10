// @vegastack skeleton@0.25.13 sha256-BEdK7NYpwhsm79pcv7wcL5utnhvKk3T3aPgNnikt0gM=

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

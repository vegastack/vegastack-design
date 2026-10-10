// @vegastack skeleton@0.25.15 sha256-peM3PQpG4zNSSEdLYIpdE1GhD/Mm+k24YKpgjnp/qpA=

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

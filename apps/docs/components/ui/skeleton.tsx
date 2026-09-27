// @vegastack skeleton@0.23.50 sha256-m60St0jhFcKgB6r9jJowFoqvkc7kpPfwYoQaglZkqbM=

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

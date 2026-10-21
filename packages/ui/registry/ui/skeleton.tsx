// @vegastack skeleton@0.25.63 sha256-t4xr6ZaOz7HplO++74LLplrzoQCjS1ibKFJyoPer5eA=

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

// @vegastack skeleton@0.23.51 sha256-Lb/TGpWNlknR59BjE4ghfOl5lISaG/EMq4zgmpuxyHM=

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

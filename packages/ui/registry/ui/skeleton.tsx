// @vegastack skeleton@0.25.50 sha256-mKEHebJJOKeicgRmsHob+uZwDCN+CxoD0nyZNrgO37o=

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

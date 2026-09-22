// @vegastack skeleton@0.11.1 sha256-PGPbFwldfOJerzNEeIwCyiokX8jyqr55KEVadiy2Xpk=

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

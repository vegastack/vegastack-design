// @vegastack skeleton@0.25.47 sha256-pCVvdvopS+FMsGXRpsrWKHTGGkqmVl555CkqZVpj+GU=

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

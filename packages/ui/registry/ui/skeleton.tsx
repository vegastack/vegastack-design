// @vegastack skeleton@0.25.32 sha256-SCQP+/f1iIbGn8HIvpf/+DWYruloeA5D0rWEzuw+onY=

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

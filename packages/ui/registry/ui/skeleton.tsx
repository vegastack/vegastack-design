// @vegastack skeleton@0.25.24 sha256-puJIuA5ZjwpH+4EAtjciqy4uLQ622kLhUN+8i4uk+rU=

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

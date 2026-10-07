// @vegastack skeleton@0.24.2 sha256-uNKgMep+XhIgxMuQU8nmNwwIaTvA+EoA9gAYz1slxJg=

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

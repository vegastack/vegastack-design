// @vegastack skeleton@0.10.0 sha256-jJKGnxoCDskx1dQn0wkAJD7ELG2l7H3zj4QBud8eO/k=

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

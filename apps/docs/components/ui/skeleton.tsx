// @vegastack skeleton@0.23.70 sha256-DdEhcKDQECCi6qLNWuilDXmAwXFs8wbYyJh1mftyzxE=

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

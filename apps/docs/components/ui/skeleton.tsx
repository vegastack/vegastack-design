// @vegastack skeleton@0.23.26 sha256-nn1m9WSuUMVSD25oRQC7IAB9EvWQFNkon4aEhPYIWSQ=

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

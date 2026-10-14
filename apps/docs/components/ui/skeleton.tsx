// @vegastack skeleton@0.25.42 sha256-BS/FA8J3SEeR5rhSWAOfHbOir4hoxcGU4aKqz5Glcp8=

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

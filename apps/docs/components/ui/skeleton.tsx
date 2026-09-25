// @vegastack skeleton@0.22.0 sha256-ijtH6fV6J5rW2PR9Be5H7LG4m9Lie0hKrjQjHGP35A8=

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

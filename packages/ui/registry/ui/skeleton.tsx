// @vegastack skeleton@0.23.75 sha256-AagsyVsXVxd3olXdht7WDaDfzkvr16CBHOJG4TkGhHY=

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

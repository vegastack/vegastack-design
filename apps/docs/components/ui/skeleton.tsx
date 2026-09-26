// @vegastack skeleton@0.23.38 sha256-3SRBV195aPSFKNvzEGbL1oomnd/bZRZp0aZ9ZRpkfvg=

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

// @vegastack skeleton@0.23.8 sha256-2k43RwuCmp1WES86CzGfG+JYgQ9xBowx8rj22aJRd/4=

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

// @vegastack skeleton@0.23.108 sha256-exaczrLY6XnP6wg5yxOv8t7bc2qsZrW+BVgoyIL8034=

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

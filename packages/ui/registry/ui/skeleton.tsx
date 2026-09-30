// @vegastack skeleton@0.23.88 sha256-5gJrh5RKZfml8O9jTfGOXj00kVfR47Z+71zy+vUyJqs=

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

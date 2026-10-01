// @vegastack skeleton@0.23.101 sha256-KleKxt4fLU9/n5WSQh+F3NT9sGnQqKHQl2mqOnTjbpE=

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

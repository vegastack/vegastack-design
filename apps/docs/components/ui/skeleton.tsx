// @vegastack skeleton@0.17.0 sha256-kZo1OaTILZA0eavDGXE76VbPB5zZ9wg1M/svDhdlo3A=

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

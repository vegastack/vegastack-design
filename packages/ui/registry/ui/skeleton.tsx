// @vegastack skeleton@0.25.46 sha256-onR8+OqplkB2F66cwd7P/ZUFavLgAa9jkShmW5/uuv0=

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

// @vegastack skeleton@0.23.68 sha256-VInxA/iVCkg/KurytU9PuYrZmMozBk0vKFb8QENRvHs=

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

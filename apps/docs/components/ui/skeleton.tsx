// @vegastack skeleton@0.25.7 sha256-wDZaN4x0CpmZYVk+H6vKrBx3+ZUArFb5wSNhw1mZ/G0=

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

// @vegastack skeleton@0.19.0 sha256-LDd+knhuN7c0zggO6Zi0DrtIzeChpzh1W4JaQU4FO8c=

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

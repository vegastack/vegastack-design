// @vegastack skeleton@0.25.35 sha256-mT2fbUKjj1WyERCQluKhyqEEdU9YLfG2Hls8WEuynFs=

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

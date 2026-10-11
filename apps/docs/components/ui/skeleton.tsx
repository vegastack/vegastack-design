// @vegastack skeleton@0.25.21 sha256-I2GjJYhdv2KUOCUP+WTXr92mBzAIiTtOG2LyYxn2eow=

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

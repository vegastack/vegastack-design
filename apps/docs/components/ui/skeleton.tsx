// @vegastack skeleton@0.25.34 sha256-ujI449QFTQ6oVqjtumGlxWugLhUwyKIOSOXX7F71yR4=

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

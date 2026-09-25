// @vegastack skeleton@0.23.16 sha256-8OVUB2iSeAIPEjkZUN/zuzqMSSm9iz2flWWzyN1RciI=

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

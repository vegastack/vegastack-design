// @vegastack skeleton@0.23.103 sha256-02ZT4xTje5IPK5xgPx+7cquj+AoF543xDGV0/Nn859M=

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

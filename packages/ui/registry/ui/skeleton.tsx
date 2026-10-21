// @vegastack skeleton@0.25.61 sha256-lFrYI2xbHdEon+kS9lKFiuX/kPSydaDBSTKVDUVGuiM=

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

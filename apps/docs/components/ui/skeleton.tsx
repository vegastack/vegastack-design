// @vegastack skeleton@0.11.0 sha256-tUGrbUndjvDnl4xSMtPvZGvduCXfTSh4sGpR3iRISFM=

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

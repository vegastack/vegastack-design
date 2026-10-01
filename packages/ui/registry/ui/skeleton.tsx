// @vegastack skeleton@0.23.106 sha256-/jdywF5pHaQ4hBG/wucOcAyOU0/+bqPCbyvMd7b/F6s=

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

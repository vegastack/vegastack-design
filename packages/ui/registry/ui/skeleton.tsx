// @vegastack skeleton@0.23.123 sha256-66c2LFOq3Iv489KEXZ8GLi+E+HbClY2TafMAH4Ss22Q=

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

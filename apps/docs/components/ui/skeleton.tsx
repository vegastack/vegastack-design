// @vegastack skeleton@0.23.115 sha256-ojaG/73vL7KdyuMevvfSan/jiIpaYwCSjPqDodnuV7M=

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

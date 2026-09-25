// @vegastack skeleton@0.23.18 sha256-FvEEf9GP9zhQaAL0RIBtrf0dYiPO2pZ+OxCA9cGEUyQ=

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

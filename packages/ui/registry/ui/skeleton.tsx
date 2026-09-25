// @vegastack skeleton@0.23.25 sha256-uZ4LdiQI58h7ZcJ01Ef1bjLZi4jz6T6gxtZRxE/Kw2k=

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

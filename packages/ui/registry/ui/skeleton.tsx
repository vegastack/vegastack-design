// @vegastack skeleton@0.23.126 sha256-PogBPQYTeakSm9p1aTTFliqIe7alo45dDTrnJu4FDzo=

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

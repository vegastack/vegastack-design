// @vegastack skeleton@0.17.1 sha256-YszH5k+gfEtr5S/WUapjVQ2Z7plJ8LR4aYq6PzN8/Xg=

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

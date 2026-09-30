// @vegastack skeleton@0.23.84 sha256-nPiItdKuOwUiZIYxwu8BFH1sYTr7uJhMA5F5SwcxoQY=

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

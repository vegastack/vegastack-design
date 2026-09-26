// @vegastack skeleton@0.23.39 sha256-zyKbrEPLOzF7L9gN0fzYZYocw99VE7pYwWdWsd3Dm6U=

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

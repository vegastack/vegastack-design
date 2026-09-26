// @vegastack skeleton@0.23.37 sha256-aB9cE+10OpbRCOOLpHxEryl6GCAweOV8OYuy4FC55QA=

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

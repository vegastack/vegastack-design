// @vegastack skeleton@0.23.80 sha256-2oT/aOmRCjnNlKGVFfeb0qfhaY0KHAjeANSthoN1hTM=

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

// @vegastack skeleton@0.21.0 sha256-gvqD6ikDopjRJXrKPdtyiEVmaHu3z5znSEgiKlV4DEQ=

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

// @vegastack skeleton@0.25.22 sha256-nXs61sOSkogAB4zBdrjFazvxs6knW3B1ERo5UuU0GCw=

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

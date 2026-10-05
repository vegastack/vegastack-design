// @vegastack skeleton@0.23.125 sha256-xFeAXDeNnv61GtUU44RPuJ464ERv4BLLHKBUMjTbG8s=

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

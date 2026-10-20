// @vegastack skeleton@0.25.53 sha256-is+JhhnWUsXxnTdJmiiF6NQ7K/GhccbndV8E8c///9c=

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

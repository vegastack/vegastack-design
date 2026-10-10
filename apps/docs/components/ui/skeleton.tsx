// @vegastack skeleton@0.25.10 sha256-XkUE1NzsWUxMfdT46wMKBDSuptZoxzH9bf0FUURHNkQ=

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

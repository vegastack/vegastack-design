// @vegastack skeleton@0.23.12 sha256-5m6FBkHM7pRLzcCWXxQBciL9Fo7BFf1FzQzpII/u+Qw=

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

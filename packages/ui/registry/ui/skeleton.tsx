// @vegastack skeleton@0.23.99 sha256-rpYfwDM2bxVVFxdw/n5/ou1lilNcKjKSQ1aQXQQgzzc=

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

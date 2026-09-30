// @vegastack skeleton@0.23.91 sha256-CkO6wHnyHQz34KJQ5FzRUxwEKch26xz7+nWug9/ledk=

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

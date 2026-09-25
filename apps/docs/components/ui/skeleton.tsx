// @vegastack skeleton@0.23.2 sha256-1U/cQELfrE7aK3oBrwWZj8HgvH5NWpYePX5iiFRmYtE=

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

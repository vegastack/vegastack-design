// @vegastack skeleton@0.23.85 sha256-8Dq1MC6LXk5XDXYf7yTZNpVOHXW3kOTTkrTHMJEbUxk=

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

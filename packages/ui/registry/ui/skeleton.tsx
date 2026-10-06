// @vegastack skeleton@0.23.127 sha256-kMG0jZLqAmmhwYXGWo1kLyPOoEFWpd5I7B19DBigSJ0=

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

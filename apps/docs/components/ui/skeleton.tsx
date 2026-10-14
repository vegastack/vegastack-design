// @vegastack skeleton@0.25.41 sha256-x8F6oq3KyL3uRZXW8Sk5ZgeBkWvcg4Oqh9QF5fhWJQI=

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

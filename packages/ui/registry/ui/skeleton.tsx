// @vegastack skeleton@0.18.0 sha256-yA/HN6K7CrAuNbcHRe9nx5izQZWUNkK4BlfYY/yGgCY=

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

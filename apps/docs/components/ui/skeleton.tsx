// @vegastack skeleton@0.23.95 sha256-76z7h87oP3QbqnX5spOzjD3irQFaCp51PEWKH4dA1Kk=

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

// @vegastack skeleton@0.23.45 sha256-MNqAu+7sGKQSJG26Z6JDHeVDCPJjbF3eofguXsYuSkk=

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

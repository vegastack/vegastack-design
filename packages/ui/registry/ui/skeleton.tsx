// @vegastack skeleton@0.23.82 sha256-S+fksHwk5cNcAFs7pBF8yo7xvQb8ugbq6BBYAnNavZk=

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

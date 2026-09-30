// @vegastack skeleton@0.23.90 sha256-WIQXi3TqTshxtedt4wIpJrj+F/8MZQAt71cjR2EH9g4=

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

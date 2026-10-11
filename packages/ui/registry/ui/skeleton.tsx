// @vegastack skeleton@0.25.16 sha256-RH2XOdOFY8SC7cYu2W5bmia0M4IpEoy0SYgG4PNjG60=

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

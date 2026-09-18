// @vegastack skeleton@0.9.1 sha256-Vyog6iRjGEPNJ99oiysHAE7+2r/8YsXcm4y0JGxqOOg=

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

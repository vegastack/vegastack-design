// @vegastack skeleton@0.23.69 sha256-lNfKPQYNhV5wnZ/LKr0UQrBAfPWmOGP7AUYBCCgORZY=

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

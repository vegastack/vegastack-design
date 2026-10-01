// @vegastack skeleton@0.23.114 sha256-06wiDSvo/IUtvi2zCGOGZeG4fe4tF4T/4peoLq9dkBI=

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

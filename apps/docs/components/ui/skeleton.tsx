// @vegastack skeleton@0.23.79 sha256-IPg1MdE/ZL52vvW935VNlvNgxRif31qbfWZs/U87ZII=

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

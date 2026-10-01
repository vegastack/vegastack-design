// @vegastack skeleton@0.23.104 sha256-vciRmSoxZkNyhRjjeySw/cB/Y2Gk08lU2YOWMIYhc98=

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

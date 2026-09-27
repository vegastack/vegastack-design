// @vegastack skeleton@0.23.65 sha256-2QNdKpP1Acrpi5T8+vZPdpBlWXGioCg/KVl8PMBCdeA=

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

// @vegastack skeleton@0.23.36 sha256-o5esaqdUBSrz4T0Vung24lMP5DnQ8A2PhUsyGUvBoAc=

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

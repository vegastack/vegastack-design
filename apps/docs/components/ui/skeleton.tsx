// @vegastack skeleton@0.23.118 sha256-5LcsDs4/SgXU5tDCfOTO1NozDRhphUXddYIhOGL2cEs=

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

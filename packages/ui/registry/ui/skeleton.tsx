// @vegastack skeleton@0.14.0 sha256-1sWubBiGuNMnDWkl8vTbito/cHUZeO3E7rMVFdeT9E4=

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

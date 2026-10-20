// @vegastack skeleton@0.25.52 sha256-hF66DU/KYhIphH3FDvgVH4ZJA1rGnySCQWpfyoRylT4=

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

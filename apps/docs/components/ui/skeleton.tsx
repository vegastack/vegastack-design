// @vegastack skeleton@0.23.109 sha256-9aUTFyzDytg2exO6DXBVFQmzChwOoRYRKJ1+bd5BF2M=

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

// @vegastack skeleton@0.25.29 sha256-C2luVtQzcEhhQL9xRkdHbtGisbbJaZthOggzthd5H+A=

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

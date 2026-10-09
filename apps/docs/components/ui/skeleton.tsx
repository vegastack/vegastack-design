// @vegastack skeleton@0.25.8 sha256-TuynxTyJMRBgUBigMw4zX1UnOvj3Y7Mxf3bwunODqws=

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

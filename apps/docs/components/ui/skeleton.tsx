// @vegastack skeleton@0.23.43 sha256-FNBiGTP1x3LghuNH4iTFkV4Ob+mNpmrzysLz5p6WAiY=

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

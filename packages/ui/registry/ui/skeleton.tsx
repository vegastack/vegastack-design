// @vegastack skeleton@0.13.0 sha256-ybm7bfhwFWug2j3ERcQdxm8PgOakJhCvWMF9vhdsXSo=

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

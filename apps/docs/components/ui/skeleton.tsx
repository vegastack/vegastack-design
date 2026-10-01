// @vegastack skeleton@0.23.98 sha256-gGM0CsZxervwIa8yWb4gRUGcb4AdD0a05baL34oAoyA=

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

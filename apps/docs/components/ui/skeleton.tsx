// @vegastack skeleton@0.23.3 sha256-q6zw1wXNeTR2ry5eogv7Wb0fyyf+qafG5mMdQ+irVrc=

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

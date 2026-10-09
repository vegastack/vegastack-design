// @vegastack skeleton@0.25.6 sha256-zNNWObidjIHJETvVH8c7cVXtq0HXGZ2iy7vbZfbKEC4=

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

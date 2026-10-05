// @vegastack skeleton@0.23.124 sha256-iM58JyXy1OGi3YyfP8htEACVm1G+hZOQN1c+s8kqRZQ=

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

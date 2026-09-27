// @vegastack skeleton@0.23.53 sha256-0EEKbQBGK3LUn4HnwXTVsGLzSFlus1i38qIWKHTaHmA=

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

// @vegastack skeleton@0.25.56 sha256-m8XgkNLQIVP5ckvNXxDWlzdjAwH0RtYjrP2ZMmxFnq0=

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

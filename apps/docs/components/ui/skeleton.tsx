// @vegastack skeleton@0.23.48 sha256-+7MWq5b8sGScjjYQOkEae8j5aYy5bvG2Amh+uQN0Qew=

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

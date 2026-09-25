// @vegastack skeleton@0.23.33 sha256-LlPpyF7ejAezpaZEctQq0kdH9dnA8lbpw5pW5RDtOQc=

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

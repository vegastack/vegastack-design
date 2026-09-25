// @vegastack skeleton@0.23.32 sha256-tn1fuGyRYGEsx8h9jWeINZ3lr5uAPcV0Tnwz+JrTg+E=

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

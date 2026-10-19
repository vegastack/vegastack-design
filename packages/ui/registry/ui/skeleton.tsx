// @vegastack skeleton@0.25.45 sha256-qJuynZzNhNVQ14ryd9bQUwzKx3L4pRT36m/oWZxpXCg=

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

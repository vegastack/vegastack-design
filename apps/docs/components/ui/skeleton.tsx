// @vegastack skeleton@0.23.110 sha256-ai0KOy1ncEVw5VTVwzQ9iy6xiMc/qdC6TEnidsdJBIA=

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

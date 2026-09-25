// @vegastack skeleton@0.23.30 sha256-IkBoeS4tuKNRtNyaQS0+0f7Dbk5/EVRP3JHM6rGqsRI=

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

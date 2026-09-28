// @vegastack skeleton@0.23.66 sha256-I1VbcO67bk8Dzx2blTQXX+ikzoN/tcQefeP8n43BALE=

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

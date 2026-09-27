// @vegastack skeleton@0.23.52 sha256-MR91IHt9Tz4Mf23drLQ4Ao7m6f/WSPiu/Ye6pMfm9Lo=

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

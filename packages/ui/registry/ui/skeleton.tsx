// @vegastack skeleton@0.12.2 sha256-PZa0G/wIj14r0dKBmLRsAkxGr4jMBMjotSlHcz02108=

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

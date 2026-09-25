// @vegastack skeleton@0.23.4 sha256-mUWePiAyFm88eU7xO/eqxQ9/PHVG3rGW+3WH5ScTc38=

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

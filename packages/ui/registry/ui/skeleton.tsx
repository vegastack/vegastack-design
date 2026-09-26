// @vegastack skeleton@0.23.41 sha256-XAAm5/eF4yroTPyEYlrIAoSsypf+tD72YwGM4HaJJ4I=

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

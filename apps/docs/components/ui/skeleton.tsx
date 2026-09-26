// @vegastack skeleton@0.23.40 sha256-ykVlNXrgy3DrfgNnPOb231NPF0yaP+HkS+dwLNRzfKA=

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

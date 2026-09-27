// @vegastack skeleton@0.23.46 sha256-Wdr4WDzyqY+zZhB5FfW3W5lzZycJi7DIq1wH6gLto48=

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

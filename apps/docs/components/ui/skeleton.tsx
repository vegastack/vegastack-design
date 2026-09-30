// @vegastack skeleton@0.23.83 sha256-i4OKMeYqEnpotPSjxmqzfVWWwGWeuAtycJDQqga0W7s=

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

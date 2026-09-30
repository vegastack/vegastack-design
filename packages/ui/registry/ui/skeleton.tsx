// @vegastack skeleton@0.23.94 sha256-9SSJlCTkdzsElz/2H8Lu+UE8c9Q99TE+Euy4FtZnQUE=

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

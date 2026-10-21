// @vegastack skeleton@0.25.60 sha256-L5wRbkYBRZ0XhN4lApjTW+wSRJGEBMzjgr8bcuuzQEA=

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

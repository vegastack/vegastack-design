// @vegastack skeleton@0.23.78 sha256-hWcMzkJbSRz0RxJIymCn2PxreTr3YWIxCEOvMVh+3WI=

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

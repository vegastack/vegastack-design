// @vegastack skeleton@0.25.14 sha256-evYjvTIPCX+hiGjkBC6z9YH/lqSoepb5zKhA8siadKQ=

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

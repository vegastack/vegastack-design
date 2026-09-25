// @vegastack skeleton@0.23.10 sha256-0XgXDfTjFss+mL/yVQqXGVw4cyCxHt6NBQoL3AQYE2Q=

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

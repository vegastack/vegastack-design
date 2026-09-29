// @vegastack skeleton@0.23.72 sha256-wVEakAEsw4rrGg0s0Yf0HS6zxcwumt7NcSaMvUFwxLY=

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

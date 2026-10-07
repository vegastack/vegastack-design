// @vegastack skeleton@0.24.5 sha256-NFhR7byJUri6lPqT3Vgic7ilNORfjzLn+utRwCqVQFo=

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

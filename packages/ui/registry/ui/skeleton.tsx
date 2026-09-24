// @vegastack skeleton@0.21.1 sha256-k5NJXegxipVyEvwSYCWQnNe50FOS0jTkW3Xs7N64IEs=

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

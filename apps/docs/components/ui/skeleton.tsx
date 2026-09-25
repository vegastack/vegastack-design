// @vegastack skeleton@0.23.9 sha256-T5fOmjNqwtEzoz1g4mK2D5CkzrSUg3/bMKdO0gMPpq8=

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

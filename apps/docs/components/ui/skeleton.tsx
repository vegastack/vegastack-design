// @vegastack skeleton@0.23.55 sha256-pU2EfDYBmP7rYIAP6f9yUJ4YxlkXQEcSBx3Anznwzjc=

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

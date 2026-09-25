// @vegastack skeleton@0.23.23 sha256-Ce/k+5GzJDnO0zbjMHOREW3hlMpdkrTjNVOhYCnF0zE=

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

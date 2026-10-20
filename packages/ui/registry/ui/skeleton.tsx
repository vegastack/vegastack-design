// @vegastack skeleton@0.25.49 sha256-cK2gFFXZjwINAOCxsfKRzm7ZDYb0OUQ9cfgFgLaEBh8=

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

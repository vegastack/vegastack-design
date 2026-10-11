// @vegastack skeleton@0.25.20 sha256-8gp0uK9qxpjA8mnUwR36/1N1XlhaG82jqeWbkBtydhw=

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

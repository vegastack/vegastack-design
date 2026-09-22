// @vegastack skeleton@0.12.1 sha256-Tato3wpy8v76IM6kbGjeU0fO7h6KR4FrpsXM1jXCoIE=

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

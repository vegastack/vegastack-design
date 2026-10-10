// @vegastack skeleton@0.25.11 sha256-BB4XrIdF/Ypuln5CUIXJlL7iZ1stGOCC0jGnVbWZpns=

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

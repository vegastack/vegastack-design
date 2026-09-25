// @vegastack skeleton@0.23.14 sha256-R0mx/fjYTkGd5V7VTz3ELCIW4awNJb6aW6pLYxHPdaA=

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

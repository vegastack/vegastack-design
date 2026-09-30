// @vegastack skeleton@0.23.86 sha256-nHtZdLCz6Ye6v+jNPRI4rUKoPcvnP007g3Fo4EPJwDo=

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

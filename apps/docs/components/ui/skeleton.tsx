// @vegastack skeleton@0.23.87 sha256-9ceSpG8oYAOb8YWTUnSP8ucCPxlwrVgqK7X28YR5D+w=

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

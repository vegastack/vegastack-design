// @vegastack skeleton@0.23.5 sha256-mEnsWE+5+0yZ5+Z1od5j3Mk9QjU/CmPiPnEOcPXdDE8=

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

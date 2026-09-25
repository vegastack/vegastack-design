// @vegastack skeleton@0.23.1 sha256-Gzl5wIpihSUqEWd7lgZJe/7TO6KjpnTHJ/hbdzv1y9M=

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

// @vegastack skeleton@0.23.42 sha256-wSEzGPrshWfDs0FUpvQ03s1lDXigUYW3N/QRWLkhRKQ=

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

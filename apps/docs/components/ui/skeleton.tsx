// @vegastack skeleton@0.23.15 sha256-Q2QQ3dlO4deYTNcg0c4oKg/xpRr19Wsp4CsknYg+RMQ=

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

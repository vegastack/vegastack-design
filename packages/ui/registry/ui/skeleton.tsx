// @vegastack skeleton@0.25.19 sha256-lMPxbUkJVrRLwwC4S6dag12Yq5yuE0MAD3hfBLL4DcQ=

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

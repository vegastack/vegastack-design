// @vegastack skeleton@0.23.28 sha256-BnSq38VnZDuLdVds3CUWMgNLutcm2EguRB5nb79NRbA=

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

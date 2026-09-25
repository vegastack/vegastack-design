// @vegastack skeleton@0.23.35 sha256-DBq6U5jBefVm3tZGku2mfmUw+aTg3p/vLdMTGIDTthA=

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

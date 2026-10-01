// @vegastack skeleton@0.23.113 sha256-Y0AAYZZRFTcA4jKVtX5seAt+m9wpGesL9GHAzezTrTk=

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

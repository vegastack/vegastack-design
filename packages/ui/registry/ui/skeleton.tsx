// @vegastack skeleton@0.23.11 sha256-8t4PXBYc3UuhHyL1FyknOmMwdy2nVEH1BTo6U2CNmno=

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

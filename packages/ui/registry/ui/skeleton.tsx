// @vegastack skeleton@0.23.62 sha256-/XF7FxCRxgj9KcbiN1Ae3GmTo1ZSOvbNUWwujCesMEc=

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

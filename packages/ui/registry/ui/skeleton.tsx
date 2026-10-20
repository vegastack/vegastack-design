// @vegastack skeleton@0.25.57 sha256-iBJv2uiWlzwJjABka23vjWVdKn2Eu6TRn/zIg9zIw+U=

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

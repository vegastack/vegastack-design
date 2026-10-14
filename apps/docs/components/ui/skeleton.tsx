// @vegastack skeleton@0.25.38 sha256-OHzEyVK05Q9VlqmCwuUXb8LTH7xlyBbkl44zIAJSIE4=

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

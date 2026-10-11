// @vegastack skeleton@0.25.18 sha256-schRZeu6S8N/ecdN8YZsO8Fhfv7bcm8PCXGv2wA7+0g=

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

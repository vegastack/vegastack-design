// @vegastack skeleton@0.25.2 sha256-6LJ0TT3sGDsaGglrSB7TPc6XiuXwmD+k4YtpODC3ckA=

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

// @vegastack skeleton@0.23.54 sha256-SLJfCJnQy3P7zQRQLus80MXmjYnvvOPl/JffIffAcL8=

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

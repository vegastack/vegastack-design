// @vegastack skeleton@0.23.60 sha256-iBWFOy1mHgxckkv8wLPw8m7lyteA3RWPZruMvOIM03s=

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

// @vegastack skeleton@0.23.112 sha256-SA3cxEp0HBK6tr+riW5eJWuVn6cklIc3PiMTar7s2sc=

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

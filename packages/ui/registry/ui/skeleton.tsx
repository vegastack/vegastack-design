// @vegastack skeleton@0.23.61 sha256-n/IGuivGVBwdCuH+LYz23f4LrSKoLdEv9iiMT5xLL0w=

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

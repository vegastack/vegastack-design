// @vegastack skeleton@0.25.44 sha256-zERcaXmEJVA06R+DY/osChHEKlw382hn2XBtsaSsPoo=

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

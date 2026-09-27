// @vegastack skeleton@0.23.47 sha256-VY1JihcIFBYOQ99gPv+bNUUuBJ8cUSYMf//QILmRXT0=

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

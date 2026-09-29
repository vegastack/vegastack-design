// @vegastack skeleton@0.23.77 sha256-qBNt0kIeJFUJwNYKQ8w2SzB2CosyvDbQhCCQCAv0yPo=

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

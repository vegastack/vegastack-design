// @vegastack skeleton@0.25.58 sha256-9NO560LlTjQBna1pCGdjiy++e4Z/YHXCdUQSSdxoieQ=

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

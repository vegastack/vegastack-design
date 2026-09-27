// @vegastack skeleton@0.23.56 sha256-eUvYgXGr3AZxM/2My+RHeA3Wbb9FIBL1bvw/ox3+p8w=

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

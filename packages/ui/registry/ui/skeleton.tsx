// @vegastack skeleton@0.23.34 sha256-/7+myvArmg2aP0MZz10RgDGJo9rm7YR3un98jBuSgOc=

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

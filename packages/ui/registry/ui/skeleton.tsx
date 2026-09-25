// @vegastack skeleton@0.23.17 sha256-LGjaHmPXUsiqKzyTnRg075h/nnuYJS8G6KgBnvhF/Ec=

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

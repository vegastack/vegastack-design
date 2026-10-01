// @vegastack skeleton@0.23.107 sha256-L2+zhfp9Ctld6TwGYnyid9mH4cClur7gzeb7K251LGY=

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

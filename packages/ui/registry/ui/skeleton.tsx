// @vegastack skeleton@0.23.81 sha256-1P6Vx92A2lcq476AfBz+OXiSb4xqQetjCFmlIBe78Wk=

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

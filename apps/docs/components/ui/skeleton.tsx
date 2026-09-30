// @vegastack skeleton@0.23.93 sha256-jK3btOgRcrCGKs89lYa+RbXH1i/nKDLHaQlGD94qwyY=

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

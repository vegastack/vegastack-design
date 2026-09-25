// @vegastack skeleton@0.23.7 sha256-JQgAN/csWEhMM4PwtLtkSoh6izDO1AGGOKU3xyyBk7E=

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

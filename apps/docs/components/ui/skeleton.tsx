// @vegastack skeleton@0.23.122 sha256-2IUMkgL/wgSWSFfpnsKOP32i6mmw0qwoCA7YmrbznSc=

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

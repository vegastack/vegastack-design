// @vegastack skeleton@0.25.1 sha256-TBt+K17dxvf2uRTQZ6JdKe9pQJ3EvSBX0KtBKBOuVmg=

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

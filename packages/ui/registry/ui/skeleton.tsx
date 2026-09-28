// @vegastack skeleton@0.23.71 sha256-W0Pp9U01Vehi/1/Mae9ckr0mM3umEHPfaXQDA2JhGOM=

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

// @vegastack skeleton@0.23.67 sha256-+DYVT1yCA0F34kiR/qd3EMLVTjSAMrm3JFclZyJsLTY=

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

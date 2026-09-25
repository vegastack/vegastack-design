// @vegastack skeleton@0.23.19 sha256-NMMcoWZDxKMCSmrf1cAM3jcuT1qcpZj/hE/WIjBsZso=

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

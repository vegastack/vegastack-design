// @vegastack skeleton@0.23.57 sha256-xc6+AjKgBTcdbgXL7XSXHhRltp5uCL6Dri0+5I+YQwU=

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

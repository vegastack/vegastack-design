// @vegastack skeleton@0.23.64 sha256-WAIUKX+3uEEB14qNWCOvG5OPEjMOsbEWSvD4QigxmG0=

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

// @vegastack skeleton@0.25.36 sha256-QutqezNxOnBFgGJvjL0xinUTiMom/Oy1iOrf7s9OEqA=

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

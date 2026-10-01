// @vegastack skeleton@0.23.105 sha256-ppXfvsj1kVTpJBiHXauHzjVGaW+prEk0S5sDbQdhJCA=

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

// @vegastack skeleton@0.25.64 sha256-d/IDZuCrcKSlPuT0OIORRAz1ureWRo4juq0JfXeFPI0=

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

// @vegastack skeleton@0.25.43 sha256-IRPOuJZ538lI1Q26AcSUPamWMy8kTSkTEr7Yce/rrdo=

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

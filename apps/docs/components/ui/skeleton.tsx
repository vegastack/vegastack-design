// @vegastack skeleton@0.24.4 sha256-+c5Al8Bg9euHc5g2yCOgnnyeeUVE8fq/wAIJ4vP8lEQ=

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

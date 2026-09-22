// @vegastack skeleton@0.12.0 sha256-2KjjwTw+W11rSeHADRNZ7RIS8y3gB+NCEPYCaxdy9Kg=

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

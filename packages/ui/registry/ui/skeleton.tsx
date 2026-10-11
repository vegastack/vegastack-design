// @vegastack skeleton@0.25.17 sha256-9AxETC6wDTTMiPZjlJ4bK6tmQPoHpqtrc8sZXZabgu4=

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

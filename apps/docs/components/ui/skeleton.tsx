// @vegastack skeleton@0.11.3 sha256-7gMNJQN5RLnneU1XNsJTP7e5o9IVF/CTNWo2wzg06ps=

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

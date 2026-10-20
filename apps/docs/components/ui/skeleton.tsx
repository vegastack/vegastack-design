// @vegastack skeleton@0.25.48 sha256-lcXt8y4L8eMTnQH4c6trNopp50Zwk7PwwbAycHUqf1k=

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

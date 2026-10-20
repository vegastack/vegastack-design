// @vegastack skeleton@0.25.55 sha256-B6u2lQ/2F6wJly2Kx6dYE7LC9GY67wuKoDryvKUlDvw=

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

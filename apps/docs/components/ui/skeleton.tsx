// @vegastack skeleton@0.23.24 sha256-/Jy8QPvjA2knbKjKM57WAXu06h+6G4vR86+Ctwb3Nlk=

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

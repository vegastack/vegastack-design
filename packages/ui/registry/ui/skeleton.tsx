// @vegastack skeleton@0.23.116 sha256-aNDl79Ie7Fn6MnvROwHP+fWpZkhDTys6jkWzfAJJ/38=

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

// @vegastack skeleton@0.23.97 sha256-m8ofKCjamwpZoQUQyITVXs637G36EE6JLSAZQ9HZ7t4=

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

// @vegastack skeleton@0.23.89 sha256-DNo7asyRDTwciFSfBwAbdf8OYW8a3sYKf3p9Pp6Xh3k=

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

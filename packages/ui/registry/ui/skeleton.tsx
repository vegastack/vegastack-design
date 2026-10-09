// @vegastack skeleton@0.25.4 sha256-gOmHcCpQG+K25PToV6EhHZhelveiQT4mQ7wNiL7U8P8=

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

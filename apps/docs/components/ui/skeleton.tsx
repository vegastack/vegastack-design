// @vegastack skeleton@0.25.59 sha256-ZrYfDPbNqj4h3tmm7NHn7K/upw8gf0CsYi9NjScu9nw=

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

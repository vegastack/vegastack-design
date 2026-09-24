// @vegastack skeleton@0.21.2 sha256-xqQ1A4RONfH2GLCe6jKYNnAVjxdskLIhCLyNoPCz8Hk=

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

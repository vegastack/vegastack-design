// @vegastack skeleton@0.23.6 sha256-y6dq1kry3sEEJv9+9AuIv5pCSqhNCZx49Z06rAxYizk=

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

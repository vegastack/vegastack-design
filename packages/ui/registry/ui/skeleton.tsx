// @vegastack skeleton@0.25.40 sha256-DXiQ0hF5ju1NulK81y9PfnIHmUesW82PH/Y0rzUas6g=

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

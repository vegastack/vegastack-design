// @vegastack skeleton@0.25.62 sha256-Wny0fuNgARveM+OYAlLKO4b5MvbKXJw0U4SKD9upsAY=

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

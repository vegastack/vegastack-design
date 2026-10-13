// @vegastack skeleton@0.25.26 sha256-KuLyo5KaZgabC0E3C66Jd9CIX3gkGG683MtMIOtkjys=

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

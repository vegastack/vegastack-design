// @vegastack skeleton@0.23.121 sha256-HXhSROssPpsWwdCvGD26UFF9G0fL7/u8k7ouuKcgyhE=

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

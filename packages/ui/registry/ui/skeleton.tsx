// @vegastack skeleton@0.23.96 sha256-ZYx8Dyk5+dyvYJY4mdW9TbTJMlHGXINOwzMu4DH+pp4=

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

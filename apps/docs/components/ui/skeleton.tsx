// @vegastack skeleton@0.23.119 sha256-q636OeaSJP49VkIHH1jDWrgG0/HAnXW7znPpJY02XvE=

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

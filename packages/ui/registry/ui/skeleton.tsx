// @vegastack skeleton@0.23.21 sha256-rMlofdJMP3fJWMMMoL458FDlWgGZMBORXhoSzkl35Eg=

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

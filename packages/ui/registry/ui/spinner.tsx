// @vegastack spinner@0.23.10 sha256-q92pvVXrXj+hB7Zf4Qcvjb2ZFRy4PODuN7dYn9EvV6M=

import { cn } from "@vegastack/design";
import { LoaderIcon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };

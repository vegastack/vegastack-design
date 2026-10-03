// @vegastack spinner@0.23.116 sha256-DCUjLQvZCW5JSczvVY1zlgQkQqIOBGhONf78LH9yIMs=

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

// @vegastack spinner@0.60.0 sha256-3/TOFMbYk3R2m/9Hcp0mqcuQl+AC7nyMWhptT4rbotE=

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

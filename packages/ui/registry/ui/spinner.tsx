// @vegastack spinner@0.11.0 sha256-nos5u6/aMq/UX1uXnN20fs88LBUQytcWBpSahn7PMWE=

import { cn } from "@vegastack/design";
import { Loader2Icon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };

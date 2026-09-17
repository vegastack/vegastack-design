// @vegastack spinner@0.9.1 sha256-Ilr8q7orMbt7GuQCj/o0LFefuhIHtlLOTuy80NATdEM=

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

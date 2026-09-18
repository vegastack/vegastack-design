// @vegastack spinner@0.9.1 sha256-jcFLnM7uq1mxvwb2FuZlrfL9H2tubBLPgyBts84BJp4=

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

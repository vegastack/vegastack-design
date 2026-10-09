// @vegastack spinner@0.25.5 sha256-Gl7uOhVpEVsXH1SVoSIl+a/V4XvMjuzOkuoQJbJkN2M=

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

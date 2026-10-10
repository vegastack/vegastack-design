// @vegastack spinner@0.25.10 sha256-Nzv2mu/0tkrFGmzrkqNJuqXBUsGgRTPNwr+Zux4nvIA=

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

// @vegastack spinner@0.23.72 sha256-GrySO3lAGQHfX/pkig5NXZoZwQSUhq7tNdLUii60Qg0=

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

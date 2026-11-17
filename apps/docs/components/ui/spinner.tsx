// @vegastack spinner@0.106.0 sha256-U3zr7c4AfpbJAx7JDxCNH+r2cVK+Hu9ISuI+7Zo0J3g=

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

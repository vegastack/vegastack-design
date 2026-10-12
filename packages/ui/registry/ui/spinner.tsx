// @vegastack spinner@0.25.22 sha256-/Tp+IMqjjT9GNoX5Mqz7A1ayI8dEIIcbB+Cx7QdxSbs=

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

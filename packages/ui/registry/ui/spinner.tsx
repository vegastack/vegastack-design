// @vegastack spinner@0.25.46 sha256-vu6oRS3/CcSJJ3cAkYSgnbtbKQv2A6R2MnJ9aCy+H2s=

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

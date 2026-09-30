// @vegastack spinner@0.23.93 sha256-ny4BTd7ZnosHE/dmpJiqC7mlU1CcJQ9xK/PtrQOPIlE=

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

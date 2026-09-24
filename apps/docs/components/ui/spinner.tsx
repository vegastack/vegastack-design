// @vegastack spinner@0.17.0 sha256-mZ+c/DRC/SjTuvmRHmSmMpDZFYHKh7OCeaN4JJJvTGk=

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

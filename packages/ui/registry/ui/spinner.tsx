// @vegastack spinner@0.23.43 sha256-VAA1MiwXvO3Vp3TLWjPydLKAzL/s5Fm4J7qUwdPqTSw=

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

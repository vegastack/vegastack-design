// @vegastack spinner@0.29.1 sha256-VKxerGP0nQw9P/NvC6Oz3dYYfEuhsXbQGnBgCDPnBFQ=

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

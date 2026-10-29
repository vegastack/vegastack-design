// @vegastack spinner@0.25.101 sha256-21SE/d8u+K2J6l6bzA3mxZ0Rg1BEIV6Lznnr8g6A+1g=

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

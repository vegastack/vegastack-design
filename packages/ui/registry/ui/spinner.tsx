// @vegastack spinner@0.25.104 sha256-ShQtxwyrmiRFIyTxWso2k8pxmm2jOTbVx3ZU9Z9iG+s=

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

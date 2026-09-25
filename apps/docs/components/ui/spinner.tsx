// @vegastack spinner@0.23.20 sha256-o/p31JSbR9L1pWf4Q1EATitvO9Uc1Xwmr5s9nzWWW6Q=

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

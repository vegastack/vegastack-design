// @vegastack spinner@0.23.18 sha256-eERLb1czkNG9vL9PuDqGqDqnZQej1E8QdooZfstDSH4=

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

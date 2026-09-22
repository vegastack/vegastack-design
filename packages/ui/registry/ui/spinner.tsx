// @vegastack spinner@0.11.1 sha256-/+77YAzCOIyyfR9cvxcPZ4swdavTsCJNiDv+Zvqg6Ik=

import { cn } from "@vegastack/design";
import { Loader2Icon } from "lucide-react";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };

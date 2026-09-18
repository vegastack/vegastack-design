// @vegastack spinner@0.10.0 sha256-18wh5b/ZDCsSnvnAcTxyekQxej3/+tXlMooQu6qmSh0=

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

// @vegastack spinner@0.27.0 sha256-jKFKdRtV/ZmjV+G90vP20Mkyo7Pc/aR5Tf4Qm3b19F4=

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

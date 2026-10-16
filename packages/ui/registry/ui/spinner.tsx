// @vegastack spinner@0.25.43 sha256-qtJ2WN9VFILvVcp7DwQ9J8v2H/Zh6iCyxodsy+wXiuo=

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

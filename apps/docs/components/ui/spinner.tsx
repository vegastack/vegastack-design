// @vegastack spinner@0.23.64 sha256-KkFM5GCIpBsjJa9+fT+xOjzZrWNWFlGQ7iJPW6UKHg8=

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

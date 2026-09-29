// @vegastack skeleton@0.23.73 sha256-BOn5yTak+HYaFUpio17jRevfLLI0II/TMiXLLC0Gbow=

import { cn } from "@vegastack/design";

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

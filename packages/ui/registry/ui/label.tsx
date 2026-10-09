// @vegastack label@0.25.7 sha256-JLx26NKIqTLETZjk5FHF5wk+OjcU8vuxA8neeJJU/Zo=

import * as React from "react";
import { cn } from "@vegastack/design";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };

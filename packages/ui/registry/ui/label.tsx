// @vegastack label@0.24.3 sha256-XQdXu3wUzOCJda/I9UZSCwP5cCicfgS4Z6Z6DvxeoE4=

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

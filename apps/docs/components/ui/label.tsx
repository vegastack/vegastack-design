// @vegastack label@0.25.43 sha256-kkzXIEl6WCYXWmrN9hS/CTW7+V8atmFeo1laOz0t9R4=

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

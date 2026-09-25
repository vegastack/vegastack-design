// @vegastack label@0.23.8 sha256-KYkQD2z21Qqdd4PuaxENOncAa8C5AghNDR3RJjEdrHs=

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

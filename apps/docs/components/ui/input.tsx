// @vegastack input@0.23.7 sha256-TSXAcw9R9KUqIBVmd8AA0gM9vyeWbzAdPGro+expS5w=

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@vegastack/design";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-hidden file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus:border-ring/70 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 not-focus:aria-invalid:border-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:not-focus:aria-invalid:border-destructive/50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };

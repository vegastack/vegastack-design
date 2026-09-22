// @vegastack textarea@0.12.1 sha256-Ut7hyzy8qti/ZbE08AyMLq2ntr9+tVclyLqVXulNK9w=

import * as React from "react";
import { cn } from "@vegastack/design";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-hidden placeholder:text-muted-foreground focus:border-ring/70 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 not-focus:aria-invalid:border-destructive md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:not-focus:aria-invalid:border-destructive/50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };

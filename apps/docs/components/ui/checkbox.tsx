// @vegastack checkbox@0.23.12 sha256-DMEJI+RVSA/XWcryoJKjjNx5TGYBXHJZibyDBTsbujU=

"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { cn } from "@vegastack/design";
import { CheckIcon, MinusIcon } from "lucide-react";

function Checkbox({
  className,
  shape = "square",
  ...props
}: CheckboxPrimitive.Root.Props & {
  /** `circle` marks something done (a task, a to-do); `square` selects and fills in forms. */
  shape?: "square" | "circle";
}) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      data-shape={shape}
      className={cn(
        "peer relative flex size-4 shrink-0 items-center justify-center rounded-[4px] border border-input transition-colors group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 data-disabled:cursor-not-allowed data-disabled:opacity-50 not-focus:aria-invalid:border-destructive not-focus:aria-invalid:aria-checked:border-primary dark:bg-input/30 dark:not-focus:aria-invalid:border-destructive/50 data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary",
        shape === "circle" && "rounded-full",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
        render={(props, state) => (
          <span {...props}>
            {state.indeterminate ? <MinusIcon /> : <CheckIcon />}
          </span>
        )}
      />
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };

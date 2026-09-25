// @vegastack input@0.23.32 sha256-xuFjRNq7JRRos+pLhoA/r60utI/9tU8nvTTA9ueZ2sM=

import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

const inputVariants = cva(
  "w-full min-w-0 transition-colors outline-hidden file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "rounded-lg border border-input bg-transparent focus:border-ring/70 disabled:bg-input/50 not-focus:aria-invalid:border-destructive dark:bg-input/30 dark:disabled:bg-input/80 dark:not-focus:aria-invalid:border-destructive/50",
        // A borderless, transparent field for a big title (Linear's issue title). No box: the tint
        // is the focus cue, and an invalid title turns its placeholder and text destructive.
        ghost:
          "rounded-md border-0 bg-transparent px-0 hover:bg-accent/30 focus:bg-accent/50 aria-invalid:placeholder:text-destructive/70",
      },
      size: {
        sm: "h-7 px-2 py-0.5 text-sm",
        default: "h-8 px-2.5 py-1 text-base md:text-sm",
        lg: "h-auto py-1 font-heading text-xl font-semibold md:text-xl",
      },
    },
    compoundVariants: [
      { variant: "ghost", size: "sm", className: "px-0" },
      { variant: "ghost", size: "default", className: "px-0" },
      { variant: "default", size: "lg", className: "px-2.5" },
    ],
    defaultVariants: { variant: "default", size: "default" },
  },
);

type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants>;

/**
 * `Input` — a single-line text field.
 *
 * - `variant="default"`: the bordered field; focus tints the border.
 * - `variant="ghost"`: borderless and transparent, for a title you type straight onto the page.
 * - `size`: `sm` (28px), `default` (32px), `lg` (heading size — pair with `ghost` for a big title).
 *
 * @example
 * <Input variant="ghost" size="lg" placeholder="Issue title" aria-label="Title" />
 */
function Input({ className, type, variant, size, ...props }: InputProps) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      data-variant={variant ?? "default"}
      data-size={size ?? "default"}
      className={cn(inputVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Input, inputVariants };

// @vegastack toggle@0.9.1 sha256-SyzbFxvTPFB25IGDWWghACZTkrAA0wAJGMV2LUjrPS4=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cn } from "@vegastack/design";

/**
 * Toggle variants — a two-state pressed button. The pressed state is driven by
 * Base UI's `data-pressed` attribute; every value is a semantic token (no
 * hardcoded colors). Shared verbatim by `ToggleGroup` (one look, no drift).
 */
export const toggleVariants = cva(
  // ONE look (no variant axis): a borderless ghost at rest, and the shared SELECTED-CHIP recipe
  // when pressed. Toggle used to spell that recipe out by hand, which is how the system ended up
  // with four different "selected" looks across Toggle, Segmented and the two chip-shaped Tabs
  // variants (audit B6-02); it now imports the one formula, so a pressed Toggle, a pressed
  // ToggleGroup item, a Segmented chip and an active pill tab are the same thing by construction.
  // Controls round at `md` (8px).
  cn(
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-transparent text-sm font-medium whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive/70 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    "border border-transparent hover:text-foreground",
    "data-pressed:border-input data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm dark:data-pressed:bg-input/30",
  ),
  {
    variants: {
      // Control heights on the shared 28 / 32 / 40 scale (h-7 / h-8 / h-10).
      size: {
        sm: "h-7 min-w-7 gap-1 px-1.5 text-xs font-medium [&_svg:not([class*='size-'])]:size-3.5",
        md: "h-8 min-w-8 px-2",
        lg: "h-10 min-w-10 px-2.5",
      },
    },
    defaultVariants: { size: "md" },
  },
);

/** Props accepted by `Toggle`. */
export interface ToggleProps
  extends
    Omit<React.ComponentPropsWithRef<typeof BaseToggle>, "value">,
    VariantProps<typeof toggleVariants> {}

/**
 * `Toggle` — a two-state button that can be pressed on or off (e.g. bold /
 * italic in a toolbar). Built on Base UI `Toggle`; the pressed state is exposed
 * via `data-pressed` and announced with `aria-pressed`. Compose an icon as a
 * child (`lucide-react`) and pass `aria-label` for icon-only toggles.
 *
 * @example
 * <Toggle aria-label="Bold" defaultPressed><Bold /></Toggle>
 */
export function Toggle({ className, size = "md", ...props }: ToggleProps) {
  const variantClassName = toggleVariants({ size });
  const resolvedClassName: React.ComponentPropsWithRef<
    typeof BaseToggle
  >["className"] =
    typeof className === "function"
      ? (state) => cn(variantClassName, className(state))
      : cn(variantClassName, className);

  return (
    <BaseToggle
      data-slot="toggle"
      data-size={size}
      className={resolvedClassName}
      {...props}
    />
  );
}

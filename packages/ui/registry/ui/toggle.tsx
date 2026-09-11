// @vegastack toggle@0.8.2 sha256-AMlruToaFecARVnODB3+0fYzogiJIBJjzHVOZauhADY=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Toggle as BaseToggle } from "@base-ui/react/toggle";
import { cn, selectedChipVariants } from "@vegastack/design";

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
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-transparent text-label whitespace-nowrap select-none disabled:pointer-events-none disabled:opacity-(--opacity-dim) aria-invalid:border-destructive-border/(--alpha-tint-border) [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
    selectedChipVariants.item,
    selectedChipVariants.pressed,
  ),
  {
    variants: {
      // Control heights on the shared 28 / 32 / 40 scale (h-(--size-sm) / h-(--size-md) / h-(--size-lg)).
      size: {
        sm: "h-(--size-sm) min-w-(--size-sm) gap-1 px-1.5 text-label-sm [&_svg:not([class*='size-'])]:size-(--icon-inline)",
        md: "h-(--size-md) min-w-(--size-md) px-2",
        lg: "h-(--size-lg) min-w-(--size-lg) px-2.5",
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

// @vegastack toggle@0.4.1 sha256-jVtaCMRO/9/BesjktnU9TyRBytiz2Vva67LD4id0w/M=

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
  // ONE look (no variant axis): a borderless ghost at rest, and an evident neutral fill
  // when pressed (`bg-foreground/(--alpha-ink-tint)` — a clear light grey, NOT a brand colour and not the
  // heavy solid `primary`), so the "on" state reads clearly without any border. The flat
  // `accent` token is ~white in this theme, so a foreground overlay carries the contrast.
  // Controls round at `md` (8px). ToggleGroup shares this exact treatment — a standalone
  // Toggle and a group item look identical when on.
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md bg-transparent text-label whitespace-nowrap  select-none hover:bg-muted hover:text-foreground data-pressed:bg-foreground/(--alpha-ink-tint) data-pressed:text-foreground hover:data-pressed:bg-foreground/(--alpha-ink-tint-strong) disabled:pointer-events-none disabled:opacity-(--opacity-dim) aria-invalid:border-destructive-border/(--alpha-tint-border) [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-(--icon-default)",
  {
    variants: {
      // Control heights on the shared 28 / 32 / 40 scale (h-(--size-sm) / h-(--size-md) / h-(--size-lg)).
      size: {
        sm: "h-(--size-sm) min-w-(--size-sm) gap-1 px-1.5 text-label-sm [&_svg:not([class*='size-'])]:size-(--icon-inline)",
        default: "h-(--size-md) min-w-(--size-md) px-2",
        lg: "h-(--size-lg) min-w-(--size-lg) px-2.5",
      },
    },
    defaultVariants: { size: "default" },
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
export function Toggle({ className, size = "default", ...props }: ToggleProps) {
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

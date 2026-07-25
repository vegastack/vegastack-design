// @vegastack switch@0.3.0 sha256-98MuloKeDs4Llsb8CBlyBBjdUEkHBFJiBX+BXg9CN1s=

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { cn } from "@vegastack/design";

/**
 * Switch track variants — the outer rail. State is driven by Base UI's
 * `data-checked` / `data-unchecked` attributes (no JS state classes), and every
 * value is a semantic token (no hardcoded colors). `bg-track` when off,
 * neutral `bg-primary` ink when on, with a `:focus-visible` ring.
 */
export const switchVariants = cva(
  "group/switch relative inline-flex shrink-0 items-center rounded-full border border-transparent bg-clip-padding p-0.5  " +
    "bg-track data-checked:bg-primary " +
    "disabled:cursor-not-allowed disabled:opacity-(--opacity-dim) " +
    "aria-invalid:border-destructive-border/(--alpha-tint-border)",
  {
    variants: {
      size: {
        // `sm` (16×28) and `default` (20×36) are below the WCAG 2.5.8 24px minimum
        // in HEIGHT only — width already clears 24px at every size — so each adds a
        // vertical-only invisible hit-area expansion (`before:absolute` + the root's
        // own `relative` above) without changing the visible track.
        // Their 1px transparent border makes the pseudo-element containing box 2px
        // smaller than the visible track, so the effective insets are 6px / 4px,
        // yielding 26px in both cases. `before:inset-x-0` (left:0/right:0, NOT negative) is
        // required alongside `before:-inset-y-*` — an absolutely positioned
        // pseudo-element with only top/bottom set and left/right left `auto`
        // shrink-to-fit to 0 width (no content to size against), which would
        // silently collapse the expanded hit area to a zero-width sliver; pinning
        // left/right to the track's own edges keeps the width unchanged while only
        // top/bottom grow. `lg` (24×44) already meets the minimum, so it's left
        // unchanged.
        sm: "h-4 w-7 before:absolute before:inset-x-0 before:-inset-y-1.5",
        default: "h-5 w-9 before:absolute before:inset-x-0 before:-inset-y-1",
        lg: "h-6 w-11",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/**
 * Switch thumb variants — the movable knob. Sized so it sits inset from the
 * track with a uniform ~2px gap on every edge in both states: thumb = track
 * height − border − 2×gap, and the on-state travel = track width − track height
 * (so the gap is identical at rest and when checked). Slides via `data-checked`
 * and a token-driven `transition`.
 */
export const switchThumbVariants = cva(
  "pointer-events-none block rounded-full bg-background ring-0 transition-transform duration-fast ease-standard " +
    "data-unchecked:translate-x-0",
  {
    variants: {
      size: {
        sm: "size-2.5 data-checked:translate-x-3 rtl:data-checked:-translate-x-3",
        default:
          "size-3.5 data-checked:translate-x-4 rtl:data-checked:-translate-x-4",
        lg: "size-4.5 data-checked:translate-x-5 rtl:data-checked:-translate-x-5",
      },
    },
    defaultVariants: { size: "default" },
  },
);

/** Props accepted by `Switch`. */
export interface SwitchProps
  extends
    React.ComponentProps<typeof BaseSwitch.Root>,
    VariantProps<typeof switchVariants> {
  /**
   * Track + thumb scale. `sm` (16px), `default` (20px), `lg` (24px).
   * @default 'default'
   */
  size?: "sm" | "default" | "lg";
  /**
   * Replace the rendered track element via Base UI `render` composition. Pass a
   * `ReactElement` or a render function — Base UI merges this
   * wrapper's `className`, `data-slot`, and state `data-*` onto your element,
   * forwards the ref, and keeps the `<Switch.Thumb>` child. The element must
   * support `role="switch"` semantics.

   * @default undefined
   */
  render?: React.ComponentProps<typeof BaseSwitch.Root>["render"];
}

/**
 * `Switch` — an on/off toggle built on Base UI's `Switch` (`Root` + `Thumb`).
 * Use it for instant, self-saving binary settings (notifications on/off, dark
 * mode) where a Checkbox's submit-on-form semantics don't apply.
 *
 * Controlled via `checked` / `onCheckedChange`, or uncontrolled via
 * `defaultChecked`. By default, Base UI renders a `<span role="switch">` plus a
 * hidden `<input>` for form submission; use `nativeButton render={<button />}`
 * when pairing a sibling `<label htmlFor>` with the switch. The root is keyboard
 * accessible (<kbd>Space</kbd> / <kbd>Enter</kbd> toggle) and pairs with `Field`
 * for a label.
 *
 * @example
 * // Uncontrolled, with a label via Field
 * <Field label="Email notifications" orientation="horizontal">
 *   <Switch defaultChecked />
 * </Field>
 *
 * @example
 * // Controlled
 * <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Enabled" />
 */
export function Switch({
  className,
  size = "default",
  ref,
  ...props
}: SwitchProps) {
  return (
    <BaseSwitch.Root
      ref={ref}
      data-slot="switch"
      data-size={size}
      className={cn(switchVariants({ size }), className)}
      {...props}
    >
      <BaseSwitch.Thumb
        data-slot="switch-thumb"
        className={cn(switchThumbVariants({ size }))}
      />
    </BaseSwitch.Root>
  );
}

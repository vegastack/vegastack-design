// @vegastack priority-icon@0.23.15 sha256-L6Ttj69aF8gSHriGHmDeviaOgUlZp7xflOwhjOviQMA=

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Flag } from "lucide-react";
import { cn } from "@vegastack/design";

/**
 * PriorityIcon variants — `priority` selects the semantic colour token, `size` matches StatusIcon
 * (14 / 16 / 20 / 24px).
 *
 * Colour is conveyed through `currentColor` on a lucide `Flag`: `urgent` → `text-destructive-text`
 * (filled), `high` → `text-warning-text` (filled), `medium` → `text-info-text` (filled), `low` →
 * `text-muted-foreground` (outline), `none` → `text-muted-foreground` (dashed outline).
 */
export const priorityIconVariants = cva("inline-block shrink-0", {
  variants: {
    priority: {
      urgent: "text-destructive-text fill-current",
      high: "text-warning-text fill-current",
      medium: "text-info-text fill-current",
      low: "text-muted-foreground",
      none: "text-muted-foreground [stroke-dasharray:2_2]",
    },
    size: {
      xs: "size-3.5",
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
  },
  defaultVariants: { priority: "none", size: "md" },
});

/** Default accessible label per priority, used when no `label` is supplied. */
const PRIORITY_LABEL = {
  urgent: "Urgent priority",
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
  none: "No priority",
} as const;

/** Props accepted by `PriorityIcon`. */
export interface PriorityIconProps
  extends
    Omit<React.ComponentProps<"svg">, "color">,
    VariantProps<typeof priorityIconVariants> {
  /**
   * Priority to display, on a lucide `Flag`:
   * - `urgent` → filled, `text-destructive-text`
   * - `high` → filled, `text-warning-text`
   * - `medium` → filled, `text-info-text`
   * - `low` → outline, `text-muted-foreground`
   * - `none` → dashed outline, `text-muted-foreground`
   * @default 'none'
   */
  priority?: "urgent" | "high" | "medium" | "low" | "none";
  /**
   * Size variant: `xs` (14px), `sm` (16px), `md` (20px), `lg` (24px).
   * @default 'md'
   */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * Accessible label. Defaults to e.g. `"High priority"`. Pass `""` to make the icon decorative
   * (`aria-hidden`) when adjacent text already states the priority.
   * @default undefined
   */
  label?: string;
}

/**
 * `PriorityIcon` — a flag marking a record's priority, the sibling of `StatusIcon`. Colour comes
 * from semantic tokens via `currentColor`; the fill (filled / outline / dashed) backs up the colour
 * so the level never rests on colour alone.
 *
 * Accessible by default (`role="img"` with a derived `aria-label`). Pure presentational and
 * server-safe. Forwards its ref to the `<svg>`.
 *
 * @example
 * <PriorityIcon priority="high" size="sm" />
 */
export function PriorityIcon({
  className,
  priority = "none",
  size = "md",
  label,
  ref,
  ...props
}: PriorityIconProps) {
  const resolvedLabel = label ?? PRIORITY_LABEL[priority];
  const decorative = resolvedLabel === "";
  return (
    <Flag
      ref={ref}
      data-slot="priority-icon"
      data-priority={priority}
      data-size={size}
      className={cn(priorityIconVariants({ priority, size }), className)}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": resolvedLabel })}
      {...props}
    />
  );
}

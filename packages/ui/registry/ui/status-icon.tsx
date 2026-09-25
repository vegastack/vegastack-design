// @vegastack status-icon@0.23.25 sha256-g97TdnWZqAbBL5bn/PMqyw1qTSy4Fd2cs6O3bZrZbks=

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  Circle,
  CircleCheck,
  CircleDashed,
  CircleSlash,
  CircleX,
  Loader,
} from "lucide-react";
import { cn } from "@vegastack/design";

/**
 * StatusIcon variants — `status` selects the semantic colour token, `size` is plain Tailwind
 * (14 / 16 / 20 / 24px).
 *
 * Colour is conveyed through `currentColor`, so every status maps to a semantic text token (no
 * hardcoded hex, no numbered palette): `todo` → `text-muted-foreground`, `progress` →
 * `text-info-text`, `blocked` → `text-warning-text`, `done` → `text-success-text` (filled),
 * `cancelled` → `text-muted-foreground`.
 *
 * `progress` does NOT compose upstream's `Spinner`, and the reason is semantic rather than
 * stylistic: `Spinner` is `role="status"` named "Loading", which is a live announcement about a
 * pending operation. This is a STATE marker on a record — `role="img"` named "In progress" — so
 * composing `Spinner` would mean overriding both of the things it exists to assert. Since ICO-8 the
 * two share the same lucide glyph (`Loader`) and `animate-spin` deliberately — one loader shape
 * across the system — but they still do not share a meaning.
 */
export const statusIconVariants = cva("inline-block shrink-0", {
  variants: {
    status: {
      todo: "text-muted-foreground",
      progress: "text-info-text",
      blocked: "text-warning-text",
      done: "text-success-text",
      cancelled: "text-muted-foreground",
    },
    size: {
      xs: "size-3.5",
      sm: "size-4",
      md: "size-5",
      lg: "size-6",
    },
  },
  defaultVariants: { status: "todo", size: "md" },
});

/** The lucide icon rendered for each status. */
const STATUS_ICON = {
  todo: Circle,
  progress: CircleDashed,
  blocked: CircleSlash,
  done: CircleCheck,
  cancelled: CircleX,
} as const;

/** Default accessible label per status, used when no `label` is supplied. */
const STATUS_LABEL: Record<
  NonNullable<VariantProps<typeof statusIconVariants>["status"]>,
  string
> = {
  todo: "To do",
  progress: "In progress",
  blocked: "Blocked",
  done: "Done",
  cancelled: "Cancelled",
};

/** Props accepted by `StatusIcon`. */
export interface StatusIconProps
  extends
    Omit<React.ComponentProps<"svg">, "color">,
    VariantProps<typeof statusIconVariants> {
  /**
   * Status to display. Selects both the icon and its semantic color token:
   * - `todo` → `Circle`, `text-muted-foreground`
   * - `progress` → static `CircleDashed` (or spinning `Loader` with `animated`), `text-info-text`
   * - `blocked` → `CircleSlash`, `text-warning-text`
   * - `done` → filled `CircleCheck`, `text-success-text`
   * - `cancelled` → `CircleX`, `text-muted-foreground`
   * @default 'todo'
   */
  status?: "todo" | "progress" | "blocked" | "done" | "cancelled";
  /**
   * `progress` only: render the spinning `Loader` instead of the static `CircleDashed`. Leave it
   * off in lists and boards, where many rows would spin at once; turn it on for a single live item.
   * @default false
   */
  animated?: boolean;
  /**
   * Size variant: `xs` (14px), `sm` (16px), `md` (20px), `lg` (24px).
   * @default 'md'
   */
  size?: "xs" | "sm" | "md" | "lg";
  /**
   * Accessible label announced by assistive tech. Defaults to a human-readable
   * name derived from `status` (e.g. `"In progress"`). Pass an empty string to
   * make the icon decorative (`aria-hidden`) — only do this when adjacent text
   * already conveys the status.

   * @default undefined
   */
  label?: string;
}

/**
 * `StatusIcon` — a small status indicator icon for the canonical task states
 * `todo` / `progress` / `blocked` / `done` / `cancelled`. Each status maps to a
 * `lucide-react` icon and a semantic color token via `currentColor` (no hardcoded
 * colors). `progress` is static by default; `animated` spins a `Loader` instead
 * (reduced motion is handled globally by the `base.css` reset).
 *
 * Accessible by default: it renders `role="img"` with an `aria-label` derived
 * from `status` (or the `label` prop). When adjacent text already states the
 * status, pass `label=""` to mark the icon decorative (`aria-hidden`) and avoid
 * a redundant announcement.
 *
 * Pure presentational and server-safe — no hooks, no `'use client'`. Forwards
 * its ref to the underlying `<svg>`.
 *
 * @example
 * <StatusIcon status="done" label="Completed" />
 */
export function StatusIcon({
  className,
  status = "todo",
  size = "md",
  label,
  animated = false,
  ref,
  ...props
}: StatusIconProps) {
  const spinning = status === "progress" && animated;
  const Icon = spinning ? Loader : STATUS_ICON[status];
  const resolvedLabel = label ?? STATUS_LABEL[status];
  const decorative = resolvedLabel === "";
  return (
    <Icon
      ref={ref}
      data-slot="status-icon"
      data-icon-tone=""
      data-status={status}
      data-size={size}
      className={cn(
        statusIconVariants({ status, size }),
        spinning && "animate-spin",
        status === "done" && "fill-current [&_path]:stroke-background",
        className,
      )}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": resolvedLabel })}
      {...props}
    />
  );
}

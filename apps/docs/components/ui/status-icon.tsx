// @vegastack status-icon@0.25.11 sha256-YhKuLik7vUmca0l98EqH5gPQ88SH4SCJwX00mrIdAA8=

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@vegastack/design";

/**
 * StatusIcon variants — `status` selects the semantic colour token, `size` is plain Tailwind
 * (14 / 16 / 20 / 24px).
 *
 * The glyphs follow Linear's workflow status set and are drawn here on a 16-unit grid rather than
 * taken from lucide, which ships no partial-fill pie (operator, 09-10-2026). Colour is conveyed
 * through `currentColor`, so every status maps to one of the system's standard semantic text tokens
 * (operator, 09-10-2026 — Linear's shapes, not its palette): `backlog`, `canceled` and `duplicate` →
 * `text-muted-foreground`, `todo` → `text-foreground`, `progress` → `text-warning-text`, `review` →
 * `text-info-text`, `done` → `text-success-text`, `triage` → `text-tag-orange-text`. The marks
 * drawn on a filled disc (`done`'s check, `canceled`'s cross, `triage`'s arrow) take `stroke-background`.
 *
 * `blocked` and `cancelled` are deprecated aliases kept so the change ships without a break:
 * `cancelled` renders `canceled`; `blocked` keeps its warning ink and a slashed circle.
 */
export const statusIconVariants = cva("inline-block shrink-0", {
  variants: {
    status: {
      backlog: "text-muted-foreground",
      todo: "text-foreground",
      progress: "text-warning-text",
      review: "text-info-text",
      done: "text-success-text",
      canceled: "text-muted-foreground",
      duplicate: "text-muted-foreground",
      triage: "text-tag-orange-text",
      blocked: "text-warning-text",
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

type Status = NonNullable<VariantProps<typeof statusIconVariants>["status"]>;

/** Default accessible label per status, used when no `label` is supplied. */
const STATUS_LABEL: Record<Status, string> = {
  backlog: "Backlog",
  todo: "Todo",
  progress: "In progress",
  review: "In review",
  done: "Done",
  canceled: "Canceled",
  duplicate: "Duplicate",
  triage: "Triage",
  blocked: "Blocked",
  cancelled: "Canceled",
};

/** The outline ring every open status shares: r 6, stroke 1.5, so its outer edge sits at 6.75. */
const ring = <circle cx="8" cy="8" r="6" />;
/** The filled disc of a closed status, the same 6.75 outer edge as the ring. */
const disc = (
  <circle cx="8" cy="8" r="6.75" fill="currentColor" stroke="none" />
);

/** A filled disc with a cross — `canceled`, and the deprecated `cancelled` alias. */
const canceled = (
  <>
    {disc}
    <path
      d="M5.75 5.75L10.25 10.25M10.25 5.75L5.75 10.25"
      className="stroke-background"
    />
  </>
);

/** The glyph drawn for each status, inside a 16-unit viewBox. */
const STATUS_GLYPH: Record<Status, React.ReactNode> = {
  // Ten equal dashes: `pathLength` 20 with a 1/1 dash array.
  backlog: <circle cx="8" cy="8" r="6" pathLength={20} strokeDasharray="1 1" />,
  todo: ring,
  progress: (
    <>
      {ring}
      <path
        d="M8 4.5A3.5 3.5 0 0 1 8 11.5Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  review: (
    <>
      {ring}
      <path
        d="M8 8L8 4.5A3.5 3.5 0 1 1 4.5 8Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  done: (
    <>
      {disc}
      <path d="M5.25 8.25L7.1 10L10.75 6" className="stroke-background" />
    </>
  ),
  canceled,
  duplicate: (
    <>
      {ring}
      <path d="M4.51 9.37L9.37 4.51M6.63 11.49L11.49 6.63" />
    </>
  ),
  triage: (
    <>
      {disc}
      <path
        d="M4.75 8H11.25M6.5 6.25L4.75 8L6.5 9.75M9.5 6.25L11.25 8L9.5 9.75"
        className="stroke-background"
      />
    </>
  ),
  blocked: (
    <>
      {ring}
      <path d="M4.29 11.71L11.71 4.29" />
    </>
  ),
  cancelled: canceled,
};

/** Props accepted by `StatusIcon`. */
export interface StatusIconProps
  extends
    Omit<React.ComponentProps<"svg">, "color">,
    VariantProps<typeof statusIconVariants> {
  /**
   * Workflow status to display (Linear's set). Selects both the glyph and its semantic colour:
   * - `backlog` → dashed ring, `text-muted-foreground`
   * - `todo` → empty ring, `text-foreground`
   * - `progress` → ring with a half-filled pie, `text-warning-text`
   * - `review` → ring with a three-quarter pie, `text-info-text`
   * - `done` → filled disc with a check, `text-success-text`
   * - `canceled` → filled disc with a cross, `text-muted-foreground`
   * - `duplicate` → ring with two diagonal strokes, `text-muted-foreground`
   * - `triage` → filled disc with a left-right arrow, `text-tag-orange-text`
   * - `blocked` (deprecated) → slashed ring, `text-warning-text`
   * - `cancelled` (deprecated) → renders `canceled`
   * @default 'todo'
   */
  status?:
    | "backlog"
    | "todo"
    | "progress"
    | "review"
    | "done"
    | "canceled"
    | "duplicate"
    | "triage"
    | "blocked"
    | "cancelled";
  /**
   * `progress` only: spin the glyph. Leave it off in lists and boards, where many rows would
   * spin at once; turn it on for a single live item.
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
 * `StatusIcon` — a small status indicator for Linear's workflow states: `backlog` / `todo` /
 * `progress` / `review` / `done` / `canceled` / `duplicate` / `triage`. Each status draws its own
 * 16-unit glyph in `currentColor` over a semantic colour token (no hardcoded colours).
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
 * <StatusIcon status="review" label="Awaiting review" />
 */
export function StatusIcon({
  className,
  status = "todo",
  size = "md",
  label,
  animated = false,
  ref,
  children,
  ...props
}: StatusIconProps) {
  const spinning = status === "progress" && animated;
  const resolvedLabel = label ?? STATUS_LABEL[status];
  const decorative = resolvedLabel === "";
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      data-slot="status-icon"
      data-icon-tone=""
      data-status={status}
      data-size={size}
      className={cn(
        statusIconVariants({ status, size }),
        spinning && "animate-spin",
        className,
      )}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": resolvedLabel })}
      {...props}
    >
      {STATUS_GLYPH[status]}
      {children}
    </svg>
  );
}

// @vegastack empty-illustration@0.25.1 sha256-oykx/mxDnOaMHh8Gr780O4jwDvKWziCRPuta6+hV3KU=

import * as React from "react";
import { cn } from "@vegastack/design";

/* ---
`empty-illustration.tsx` — the one shared set of empty-state illustrations: monochrome line
drawings on a 120×90 grid, drawn in `currentColor` so they take the token colour of their context
(`text-muted-foreground` by default) and follow light and dark with no second asset.

Each drawing is two inks of one colour: the subject at full strength, the ground (a baseline,
sparkles, a shadow card) at 40%. They are decorative — the empty state's title says what is
missing — so the SVG is `aria-hidden` and never takes a name.

They are genuine graphics, not icons, which is why `design-lint`'s inline-SVG rule allowlists this
file beside `empty.tsx`. Server-safe: no hooks, no `"use client"`.
--- */

/** The drawings in the set. */
export type EmptyIllustrationName =
  | "inbox"
  | "search"
  | "files"
  | "tasks"
  | "calendar"
  | "people"
  | "messages"
  | "notifications";

const DRAWINGS: Record<EmptyIllustrationName, React.ReactNode> = {
  inbox: (
    <>
      <path d="M20 78h80" opacity={0.4} />
      <path d="M30 34l8-16h44l8 16v28a4 4 0 0 1-4 4H34a4 4 0 0 1-4-4z" />
      <path d="M30 34h18l4 8h16l4-8h18" />
      <path d="M46 26h28" opacity={0.4} />
    </>
  ),
  search: (
    <>
      <path d="M20 78h80" opacity={0.4} />
      <circle cx="54" cy="40" r="18" />
      <path d="M67 53l14 14" />
      <path d="M46 36a9 9 0 0 1 8-6" opacity={0.4} />
      <path d="M90 22v8M86 26h8" opacity={0.4} />
    </>
  ),
  files: (
    <>
      <path d="M20 78h80" opacity={0.4} />
      <path d="M44 22h24l12 12v34a4 4 0 0 1-4 4H44a4 4 0 0 1-4-4V26a4 4 0 0 1 4-4z" />
      <path d="M68 22v12h12" />
      <path d="M48 46h22M48 54h22M48 62h14" opacity={0.4} />
      <path d="M36 30v40a6 6 0 0 0 6 6h30" opacity={0.4} />
    </>
  ),
  tasks: (
    <>
      <path d="M20 78h80" opacity={0.4} />
      <rect x="34" y="18" width="52" height="54" rx="4" />
      <path d="M42 32l4 4 7-7M42 46l4 4 7-7" />
      <path d="M58 33h20M58 47h20M58 61h14" opacity={0.4} />
      <rect x="42" y="57" width="8" height="8" rx="2" />
    </>
  ),
  calendar: (
    <>
      <path d="M20 78h80" opacity={0.4} />
      <rect x="32" y="22" width="56" height="50" rx="4" />
      <path d="M32 36h56M46 16v12M74 16v12" />
      <path
        d="M42 46h4M54 46h4M66 46h4M78 46h4M42 56h4M54 56h4M66 56h4"
        opacity={0.4}
      />
      <rect x="64" y="52" width="10" height="10" rx="2" />
    </>
  ),
  people: (
    <>
      <path d="M20 78h80" opacity={0.4} />
      <circle cx="52" cy="36" r="10" />
      <path d="M34 70a18 18 0 0 1 36 0" />
      <circle cx="76" cy="40" r="7" opacity={0.4} />
      <path d="M72 56a14 14 0 0 1 18 14" opacity={0.4} />
    </>
  ),
  messages: (
    <>
      <path d="M20 78h80" opacity={0.4} />
      <path d="M28 24h44a4 4 0 0 1 4 4v22a4 4 0 0 1-4 4H44l-10 8v-8h-6a4 4 0 0 1-4-4V28a4 4 0 0 1 4-4z" />
      <path d="M36 34h28M36 42h18" opacity={0.4} />
      <path
        d="M82 38h8a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4h-4v6l-8-6H64a4 4 0 0 1-4-4v-2"
        opacity={0.4}
      />
    </>
  ),
  notifications: (
    <>
      <path d="M20 78h80" opacity={0.4} />
      <path d="M44 60V44a16 16 0 0 1 32 0v16l4 6H40z" />
      <path d="M54 70a6 6 0 0 0 12 0" />
      <path d="M60 22v6" />
      <path d="M86 30l6-4M88 42h7M34 30l-6-4M32 42h-7" opacity={0.4} />
    </>
  ),
};

/** The names in the set, in display order. */
export const EMPTY_ILLUSTRATIONS = Object.keys(
  DRAWINGS,
) as readonly EmptyIllustrationName[];

/** Props accepted by `EmptyIllustration`. */
export interface EmptyIllustrationProps extends Omit<
  React.ComponentPropsWithRef<"svg">,
  "children"
> {
  /** Which drawing to show. */
  name: EmptyIllustrationName;
}

/**
 * `EmptyIllustration` — a monochrome line illustration for an empty state, in `currentColor`.
 * Place it in `EmptyMedia` (default variant) above the title; it is decorative.
 *
 * @example
 * <Empty>
 *   <EmptyMedia><EmptyIllustration name="tasks" /></EmptyMedia>
 *   <EmptyHeader><EmptyTitle>No tasks yet</EmptyTitle></EmptyHeader>
 * </Empty>
 */
export function EmptyIllustration({
  name,
  className,
  ...props
}: EmptyIllustrationProps) {
  return (
    <svg
      viewBox="0 0 120 90"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      data-slot="empty-illustration"
      data-name={name}
      className={cn("h-20 w-auto text-muted-foreground", className)}
      {...props}
    >
      {DRAWINGS[name]}
    </svg>
  );
}

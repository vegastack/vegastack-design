// @vegastack digest-group@0.120.0 sha256-8oaV0SpXWf1v8kzjc8LsREFmTH6w6pGTjFN54duGldI=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ItemGroup } from "@/components/ui/item";

/* ------------------------------------------------------------------------------------------------
 * DigestGroup — one group in a digest ("Overdue · 12"): its title and count, an urgent mark, an
 * optional extra in the header (a blocker chip and its line), one group action ("Update all…"),
 * the rows the caller builds from `Item` with each row's own authorized actions, and a controlled
 * "Show 75 more" footer. The group holds no rows or actions of its own.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `DigestGroup`. */
export interface DigestGroupProps extends Omit<
  React.ComponentPropsWithRef<"section">,
  "title" | "children"
> {
  /** The group's name: "Overdue". */
  title: string;
  /** How many rows it holds in all, loaded or not. */
  count: number;
  /** Marks the group as needing attention first: a warning glyph before the title. @default false */
  urgent?: boolean;
  /** More in the header after the count: a blocker chip and its line. @default undefined */
  headerExtra?: React.ReactNode;
  /** The rows, built from `Item` and `ItemActions`. */
  children: React.ReactNode;
  /** One action for the whole group: "Update all…". @default undefined */
  groupAction?: { label: string; onClick: () => void };
  /**
   * The "Show N more" footer, controlled by the caller. Absent: no footer.
   * @default undefined
   */
  footer?: {
    hasMore: boolean;
    remaining?: number;
    loading?: boolean;
    onLoadMore(): void;
  };
}

/**
 * `DigestGroup` — one group of a digest: header, the caller's rows, and a controlled footer.
 *
 * @example
 * <DigestGroup
 *   title="Overdue"
 *   count={87}
 *   urgent
 *   groupAction={{ label: "Update all…", onClick: openBulk }}
 *   footer={{ hasMore, remaining: 75, loading, onLoadMore }}
 * >
 *   {tasks.map((task) => <Item key={task.id}>…</Item>)}
 * </DigestGroup>
 */
export function DigestGroup({
  title,
  count,
  urgent = false,
  headerExtra,
  children,
  groupAction,
  footer,
  className,
  ...props
}: DigestGroupProps) {
  const titleId = React.useId();
  return (
    <section
      data-slot="digest-group"
      data-urgent={urgent ? "" : undefined}
      aria-labelledby={titleId}
      className={cn("flex min-w-0 flex-col gap-1", className)}
      {...props}
    >
      <header
        data-slot="digest-group-header"
        className="flex min-h-8 min-w-0 flex-wrap items-center gap-x-2 gap-y-1"
      >
        <h3
          id={titleId}
          className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-foreground"
        >
          {urgent ? (
            <TriangleAlert
              role="img"
              aria-label="Needs attention"
              className="size-3.5 shrink-0 text-warning-text"
            />
          ) : null}
          <span className="truncate">{title}</span>
          <span
            data-slot="digest-group-count"
            className="shrink-0 font-normal text-muted-foreground tabular-nums"
          >
            {count}
          </span>
        </h3>
        {headerExtra ? (
          <div
            data-slot="digest-group-extra"
            className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
          >
            {headerExtra}
          </div>
        ) : null}
        {groupAction ? (
          <Button
            size="sm"
            variant="outline"
            data-slot="digest-group-action"
            className="ms-auto"
            onClick={groupAction.onClick}
          >
            {groupAction.label}
          </Button>
        ) : null}
      </header>
      <ItemGroup variant="flush" aria-labelledby={titleId}>
        {children}
      </ItemGroup>
      {footer?.hasMore ? (
        <div data-slot="digest-group-footer" className="flex min-w-0">
          <Button
            size="sm"
            variant="ghost"
            loading={footer.loading}
            className="-ms-2.5 text-muted-foreground"
            onClick={footer.onLoadMore}
          >
            {footer.remaining != null
              ? `Show ${footer.remaining} more`
              : "Show more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

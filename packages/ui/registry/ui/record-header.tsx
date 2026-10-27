// @vegastack record-header@0.25.90 sha256-pzmhNEXMkY3V8cbjKpOeqfoBDyTUjTeY2W0hxufi/7o=

"use client";

import * as React from "react";
import { cn } from "@vegastack/design";
import { Badge } from "@/components/ui/badge";
import { EditableCell } from "@/components/ui/editable-cell";
import { Skeleton } from "@/components/ui/skeleton";
import { TruncatedText } from "@/components/ui/truncated-text";

/* ------------------------------------------------------------------------------------------------
 * RecordHeader — the head of any record, the same on its full page and inside `RecordPeek`: an
 * eyebrow line (where it lives · its key), the icon and the title (renamed in place), the status
 * beside the title, a meta line and a chip row, with presence and the record's actions at the end.
 * It knows no record kinds: the app fills the slots.
 * ----------------------------------------------------------------------------------------------*/

/** Props accepted by `RecordHeader`. */
export interface RecordHeaderProps extends Omit<
  React.ComponentPropsWithRef<"header">,
  "title"
> {
  /** The record's title. */
  title: string;
  /**
   * Rename in place: the title becomes an `EditableCell` heading that saves on Enter or blur and
   * rolls back on a failed save. Omit for a read-only title.
   * @default undefined
   */
  onRename?: (next: string) => void | Promise<void>;
  /**
   * The title's accessible label while it is editable.
   * @default "Title"
   */
  titleLabel?: string;
  /**
   * What an empty title reads as ("Untitled").
   * @default "Untitled"
   */
  placeholder?: string;
  /**
   * The heading level: `1` on the record's own page, `2` inside a peek or a dialog.
   * @default 1
   */
  level?: 1 | 2;
  /**
   * The record's icon or emoji before the title (an `IconGlyph`, a file-kind icon).
   * @default undefined
   */
  icon?: React.ReactNode;
  /**
   * The record's key or reference ("TASK-42", "SR-12") — a string is a small outline chip; pass a
   * node for a copy-on-click chip.
   * @default undefined
   */
  keyBadge?: React.ReactNode;
  /**
   * Where the record lives, before the key: a breadcrumb, a space chip. On a full page this is
   * usually the top bar's job; inside a peek it belongs here.
   * @default undefined
   */
  eyebrow?: React.ReactNode;
  /**
   * The record's status beside the title (a `StatusBadge`, a `StatusLine`).
   * @default undefined
   */
  status?: React.ReactNode;
  /**
   * Who else is here (an `AvatarStack`), at the end of the eyebrow line.
   * @default undefined
   */
  presence?: React.ReactNode;
  /**
   * The record's actions at the end of the eyebrow line, in the contract's order: Share, Watch,
   * the ⋮ menu. On a full page they usually live in the top bar instead.
   * @default undefined
   */
  actions?: React.ReactNode;
  /**
   * The meta line under the title: a `MetaLine` of facts (created, updated, owner).
   * @default undefined
   */
  meta?: React.ReactNode;
  /**
   * The chip row under the meta line: the record's key properties as `RecordChip`s (assignee,
   * due, priority).
   * @default undefined
   */
  chips?: React.ReactNode;
}

/**
 * `RecordHeader` — the head of a record, one anatomy for every kind and both places a record
 * opens: its full page and `RecordPeek`. An eyebrow line holds where it lives and its key
 * (`eyebrow`, `keyBadge`) with `presence` and `actions` at the end; then the `icon` and the
 * `title` — renamed in place with `onRename` (an `EditableCell` heading) — with its `status`
 * beside it; then the `meta` line and the `chips` row. Every slot is optional except the title,
 * and a slot left empty leaves no gap.
 *
 * @example
 * <RecordHeader
 *   level={2}
 *   eyebrow={<SpaceChip space={space} />}
 *   keyBadge="TASK-42"
 *   title={task.title}
 *   onRename={(title) => updateTask({ title })}
 *   status={<StatusBadge status={task.status} />}
 *   presence={<AvatarStack people={here} max={3} />}
 *   actions={<TaskActionsMenu task={task} />}
 *   meta={
 *     <MetaLine>
 *       <MetaLineItem icon={<Calendar />}>Created 12 Oct</MetaLineItem>
 *     </MetaLine>
 *   }
 *   chips={<TaskChips task={task} />}
 * />
 */
export function RecordHeader({
  title,
  onRename,
  titleLabel = "Title",
  placeholder = "Untitled",
  level = 1,
  icon,
  keyBadge,
  eyebrow,
  status,
  presence,
  actions,
  meta,
  chips,
  className,
  ...props
}: RecordHeaderProps) {
  const Heading = level === 1 ? "h1" : "h2";
  const hasEyebrow = Boolean(eyebrow || keyBadge || presence || actions);
  return (
    <header
      data-slot="record-header"
      data-level={level}
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    >
      {hasEyebrow ? (
        <div
          data-slot="record-header-eyebrow"
          className="flex min-h-8 min-w-0 items-center gap-2"
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 text-sm text-muted-foreground">
            {eyebrow ? (
              <div
                data-slot="record-header-location"
                className="flex min-w-0 items-center gap-1"
              >
                {eyebrow}
              </div>
            ) : null}
            {keyBadge ? (
              typeof keyBadge === "string" ? (
                <Badge
                  variant="outline"
                  data-slot="record-header-key"
                  className="shrink-0 tabular-nums"
                >
                  {keyBadge}
                </Badge>
              ) : (
                <span data-slot="record-header-key" className="shrink-0">
                  {keyBadge}
                </span>
              )
            ) : null}
          </div>
          {presence || actions ? (
            <div
              data-slot="record-header-actions"
              className="flex shrink-0 items-center gap-1"
            >
              {presence}
              {actions}
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        data-slot="record-header-title-row"
        className="flex min-w-0 flex-wrap items-start gap-x-3 gap-y-1"
      >
        <div className="flex min-w-0 flex-1 basis-48 items-start gap-2">
          {icon ? (
            <span
              data-slot="record-header-icon"
              aria-hidden
              className={cn(
                "flex shrink-0 items-center justify-center [&_svg:not([class*='size-'])]:size-5",
                level === 1 ? "h-8" : "h-7",
              )}
            >
              {icon}
            </span>
          ) : null}
          <Heading
            data-slot="record-header-title"
            className={cn(
              "min-w-0 flex-1 font-heading font-semibold wrap-anywhere text-foreground",
              level === 1 ? "text-2xl" : "text-xl",
            )}
          >
            {onRename ? (
              <EditableCell
                variant="heading"
                wrap
                required
                label={titleLabel}
                value={title}
                onSave={onRename}
              />
            ) : (
              <TruncatedText lines={3}>{title || placeholder}</TruncatedText>
            )}
          </Heading>
        </div>
        {status ? (
          <div
            data-slot="record-header-status"
            className={cn(
              "flex shrink-0 items-center",
              level === 1 ? "h-8" : "h-7",
            )}
          >
            {status}
          </div>
        ) : null}
      </div>

      {meta ? <div data-slot="record-header-meta">{meta}</div> : null}
      {chips ? (
        <div
          data-slot="record-header-chips"
          className="flex min-w-0 flex-wrap items-center gap-1.5"
        >
          {chips}
        </div>
      ) : null}
    </header>
  );
}

/** Props accepted by `RecordHeaderSkeleton`. */
export interface RecordHeaderSkeletonProps extends React.ComponentPropsWithRef<"div"> {
  /**
   * The heading level it stands in for, so the title bar is the right height.
   * @default 1
   */
  level?: 1 | 2;
  /**
   * Reserve the eyebrow line.
   * @default true
   */
  eyebrow?: boolean;
  /**
   * Reserve the chip row.
   * @default true
   */
  chips?: boolean;
}

/**
 * `RecordHeaderSkeleton` — `RecordHeader`'s loading shape at the same heights, so nothing moves
 * when the record arrives. Decorative; the surrounding region carries the busy state.
 *
 * @example
 * <RecordHeaderSkeleton level={2} />
 */
export function RecordHeaderSkeleton({
  level = 1,
  eyebrow = true,
  chips = true,
  className,
  ...props
}: RecordHeaderSkeletonProps) {
  return (
    <div
      data-slot="record-header-skeleton"
      aria-hidden
      className={cn("flex min-w-0 flex-col gap-2", className)}
      {...props}
    >
      {eyebrow ? (
        <div className="flex h-8 items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-5 w-14" />
        </div>
      ) : null}
      <div className={cn("flex items-center", level === 1 ? "h-8" : "h-7")}>
        <Skeleton className={cn("w-3/5", level === 1 ? "h-6" : "h-5")} />
      </div>
      <div className="flex h-5 items-center">
        <Skeleton className="h-3.5 w-2/5" />
      </div>
      {chips ? (
        <div className="flex h-7 items-center gap-1.5">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
      ) : null}
    </div>
  );
}

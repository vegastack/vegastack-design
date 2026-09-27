// @vegastack record-list@0.23.64 sha256-7Twx9HKYqptdeMtlRTCSE5ydIUIkGUJBOimTtoNRgS0=

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@vegastack/design";

import { Button, buttonVariants } from "@/components/ui/button";

/* ---
`RecordList` is the "these records are affected" list a confirmation dialog shows before a
change lands: the products a family save gives new issues, the products an accessory delete
leaves. It is an ordered list, so every row is numbered — 1., 2., … — and the numbers
continue when the host appends the next batch behind `RecordListMore`'s "Show more", because
the rows stay one `<ol>`.

A row is a leading muted record-type icon, the record's name, an optional badge and an
optional one-line description. With `href`, a small ↗ link sits right after the name on the
title line — "Open {name} in a new tab" — shown on row hover or focus within the row and
always on a coarse pointer. It always opens a new tab (`target="_blank"`, `rel="noopener"`)
because the list lives in a dialog the reader has not answered yet.

Deliberately NOT done here:
- No selection and no row click. The rows are context for a decision, not controls; the one
  action per row is the new-tab link.
- No paging state. The host owns the rows and the count; `RecordListMore` is a controlled
  footer.
--- */

/** Props accepted by `RecordList`. */
export interface RecordListProps extends React.ComponentPropsWithRef<"ol"> {
  /**
   * Accessible name of the list ("Affected products").
   * @default undefined
   */
  "aria-label"?: string;
}

/**
 * `RecordList` — a numbered list of records for a confirmation dialog. Compose
 * `RecordListItem` rows inside it and `RecordListMore` after it.
 *
 * @example
 * <RecordList aria-label="Affected products">
 *   {rows.map((row) => (
 *     <RecordListItem key={row.id} icon={<Package />} title={row.name} href={`/products/${row.id}`} />
 *   ))}
 * </RecordList>
 * <RecordListMore remaining={total - rows.length} onShowMore={loadMore} />
 */
export function RecordList({ className, ...props }: RecordListProps) {
  return (
    <ol
      data-slot="record-list"
      className={cn(
        "flex list-outside list-decimal flex-col gap-1 ps-6 text-sm marker:text-xs marker:text-muted-foreground marker:tabular-nums",
        className,
      )}
      {...props}
    />
  );
}

/** Props accepted by `RecordListItem`. */
export interface RecordListItemProps extends Omit<
  React.ComponentPropsWithRef<"li">,
  "title"
> {
  /**
   * The record type's icon, drawn muted before the name.
   * @default undefined
   */
  icon?: React.ReactNode;
  /** The record's name. */
  title: React.ReactNode;
  /**
   * One line under the name — what happens to this record.
   * @default undefined
   */
  description?: React.ReactNode;
  /**
   * A status after the name and its link — a `Badge`.
   * @default undefined
   */
  badge?: React.ReactNode;
  /**
   * The record's page. Adds a ↗ link after the name that opens it in a new tab.
   * @default undefined
   */
  href?: string;
  /**
   * Accessible name of the ↗ link.
   * @default `Open ${title} in a new tab` when `title` is a string, else "Open in a new tab"
   */
  openLabel?: string;
}

/**
 * `RecordListItem` — one numbered row: icon, name, the ↗ new-tab link, badge and
 * description.
 *
 * @example
 * <RecordListItem icon={<Package />} title="Orbit Track 30W" badge={<Badge>Draft</Badge>} href="/products/p1" />
 */
export function RecordListItem({
  icon,
  title,
  description,
  badge,
  href,
  openLabel,
  className,
  ...props
}: RecordListItemProps) {
  const label =
    openLabel ??
    (typeof title === "string"
      ? `Open ${title} in a new tab`
      : "Open in a new tab");
  return (
    <li
      data-slot="record-list-item"
      className={cn("group/record-list-item ps-1", className)}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2 py-1">
        {icon ? (
          <span
            aria-hidden="true"
            data-slot="record-list-icon"
            className="flex h-5 shrink-0 items-center text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
          >
            {icon}
          </span>
        ) : null}
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex min-w-0 items-center gap-1">
              <span
                data-slot="record-list-title"
                className="truncate font-medium"
              >
                {title}
              </span>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener"
                  aria-label={label}
                  data-slot="record-list-link"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "icon-xs" }),
                    "-my-1 shrink-0 text-muted-foreground opacity-0 group-focus-within/record-list-item:opacity-100 group-hover/record-list-item:opacity-100 hover:text-foreground focus-visible:opacity-100 active:not-aria-[haspopup]:translate-y-0 pointer-coarse:opacity-100",
                  )}
                >
                  <ExternalLink aria-hidden="true" />
                </a>
              ) : null}
            </span>
            {badge}
          </div>
          {description ? (
            <span
              data-slot="record-list-description"
              className="text-xs text-muted-foreground"
            >
              {description}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/** Props accepted by `RecordListMore`. */
export interface RecordListMoreProps extends React.ComponentPropsWithRef<"div"> {
  /** How many records are not shown yet. Nothing renders at zero. */
  remaining: number;
  /**
   * Load the next batch. Without it the footer only says how many more there are.
   * @default undefined
   */
  onShowMore?: () => void;
  /**
   * A batch is loading: the button shows its spinner.
   * @default false
   */
  loading?: boolean;
  /**
   * The button's label.
   * @default "Show more"
   */
  label?: string;
}

/**
 * `RecordListMore` — "and 14 more · Show more" after a `RecordList`. The host
 * appends the next rows to the same list, so their numbers continue.
 *
 * @example
 * <RecordListMore remaining={14} onShowMore={loadMore} loading={loading} />
 */
export function RecordListMore({
  remaining,
  onShowMore,
  loading = false,
  label = "Show more",
  className,
  ...props
}: RecordListMoreProps) {
  if (remaining <= 0) return null;
  return (
    <div
      data-slot="record-list-more"
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground tabular-nums",
        className,
      )}
      {...props}
    >
      <span>{`and ${remaining.toLocaleString("en")} more`}</span>
      {onShowMore ? (
        <Button
          size="sm"
          variant="ghost"
          loading={loading}
          onClick={onShowMore}
        >
          {label}
        </Button>
      ) : null}
    </div>
  );
}

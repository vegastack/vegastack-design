// @vegastack data-list-skeleton@0.111.0 sha256-I6zcGl6i40nw4nWRpurWy7FWuOoUXEKK4VJj0mYGRS8=

import { cn } from "@vegastack/design";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/** One column of a `DataListSkeleton` table: the list's own column budget and alignment. */
export interface DataListSkeletonColumn {
  /** The column's key (React key only). */
  key: string;
  /**
   * The width the list budgets the column at, as `DataList`'s `minWidth`.
   * @default 120
   */
  minWidth?: number;
  /**
   * Cell alignment, as `DataList`'s `align`.
   * @default "start"
   */
  align?: "start" | "end";
  /**
   * Whether the column's header has text (a row-actions column's has none).
   * @default true
   */
  header?: boolean;
}

/** Props for `DataListSkeleton`. */
export interface DataListSkeletonProps extends React.ComponentProps<"div"> {
  /**
   * The list's columns (the first is the fill column), or how many plain columns to draw.
   * @default 4
   */
  columns?: readonly DataListSkeletonColumn[] | number;
  /**
   * Rows in the list view, cards in the grid view.
   * @default 5
   */
  rows?: number;
  /**
   * A leading selection column, as `DataList`'s `selectable`.
   * @default false
   */
  selectable?: boolean;
  /**
   * The view the list will open in: `list` (table rows) or `grid` (`MediaCard lg` cards).
   * @default "list"
   */
  view?: "list" | "grid";
  /**
   * The `ListToolbar` above the list: its search and this many tool buttons. `false` draws none.
   * @default false
   */
  toolbar?: false | { tools?: number; search?: boolean };
}

/** The first column's bar widths, cycled so the rows never read as one block. */
const FILL_WIDTHS = ["55%", "72%", "64%", "80%", "58%"];

function plainColumns(count: number): DataListSkeletonColumn[] {
  return Array.from({ length: Math.max(1, count) }, (_, i) => ({
    key: `c${i}`,
  }));
}

/**
 * `DataListSkeleton` — a `DataList` (and its `ListToolbar`) while it loads, in the list's own
 * geometry: the 32px toolbar, the table's header and 40px rows (other columns drop under `md`, as
 * the list merges them), or the grid's `MediaCard lg` cards in the grid's own columns. It imports
 * only `Table` and `Skeleton`, so a route's loading state never loads the list itself. Hidden from
 * assistive technology; name the loading region around it.
 *
 * @example
 * <DataListSkeleton columns={columns} rows={6} selectable toolbar={{ tools: 3 }} />
 */
function DataListSkeleton({
  columns = 4,
  rows = 5,
  selectable = false,
  view = "list",
  toolbar = false,
  className,
  ...props
}: DataListSkeletonProps) {
  const cols = typeof columns === "number" ? plainColumns(columns) : columns;
  const count = Math.max(1, rows);
  return (
    <div
      data-slot="data-list-skeleton"
      aria-hidden
      className={cn("flex min-w-0 flex-col gap-3", className)}
      {...props}
    >
      {toolbar ? (
        <div
          data-slot="data-list-skeleton-toolbar"
          className="flex h-8 items-center gap-2"
        >
          {toolbar.search !== false ? (
            <Skeleton className="h-8 w-full max-w-64 rounded-control" />
          ) : null}
          <div className="ms-auto flex items-center gap-1">
            {Array.from({ length: toolbar.tools ?? 3 }, (_, i) => (
              <Skeleton key={i} className="size-8 rounded-control" />
            ))}
          </div>
        </div>
      ) : null}
      {view === "grid" ? (
        <div className="@container/data-list">
          <div className="grid grid-cols-1 gap-3 @xs/data-list:grid-cols-2 @2xl/data-list:grid-cols-3 @5xl/data-list:grid-cols-4 @7xl/data-list:grid-cols-5">
            {Array.from({ length: count }, (_, i) => (
              <div
                key={i}
                data-slot="data-list-skeleton-card"
                className="flex min-w-0 flex-col overflow-hidden rounded-card border border-border"
              >
                <Skeleton className="aspect-video w-full rounded-none" />
                <div className="flex flex-col gap-1 p-3">
                  <Skeleton className="my-0.5 h-4 w-3/4" />
                  <Skeleton className="my-0.5 h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {selectable ? <TableHead className="w-0" /> : null}
              {cols.map((c, i) => (
                <TableHead
                  key={c.key}
                  style={{ minWidth: c.minWidth ?? 120 }}
                  className={i > 0 ? "max-md:hidden" : "w-full"}
                >
                  {c.header !== false ? (
                    <Skeleton
                      className={
                        c.align === "end" ? "ms-auto h-3 w-12" : "h-3 w-16"
                      }
                    />
                  ) : null}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: count }, (_, r) => (
              <TableRow
                key={r}
                data-slot="data-list-skeleton-row"
                className="h-10"
              >
                {selectable ? (
                  <TableCell className="w-0">
                    <Skeleton className="size-4 rounded-mark" />
                  </TableCell>
                ) : null}
                {cols.map((c, i) => (
                  <TableCell
                    key={c.key}
                    className={i > 0 ? "max-md:hidden" : undefined}
                  >
                    {i === 0 ? (
                      <span className="flex items-center gap-2">
                        <Skeleton className="size-4 shrink-0" />
                        <Skeleton
                          className="h-3.5"
                          style={{ width: FILL_WIDTHS[r % FILL_WIDTHS.length] }}
                        />
                      </span>
                    ) : (
                      <Skeleton
                        className={
                          c.align === "end" ? "ms-auto h-3 w-10" : "h-3 w-20"
                        }
                      />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}

export { DataListSkeleton };

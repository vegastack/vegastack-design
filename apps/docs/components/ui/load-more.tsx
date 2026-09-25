// @vegastack load-more@0.23.25 sha256-EaKoKxYF0RN8bMacBxJ9c6OS/EKdrZsZXXeW81Iq6ko=

"use client";

import * as React from "react";
import { cn, mergeRefs } from "@vegastack/design";
import { Button } from "@/components/ui/button";

/* ---
`LoadMore` is the one "Load more" footer for keyset lists: DataList's and
DataGrid's `loadMore`, board lanes and any host-paged feed. A keyset list has
no total and no page numbers, so the footer says only what the reader can do
next — load the next batch, retry a batch that failed — and, when the host
asks for it, that the list has ended.

It is CONTROLLED and owns no data: the host holds `hasMore`, `loading` and
`error`, and `onLoadMore` fetches the next batch (a retry is the same call).
`LoadMoreState` is that contract on its own, so a list can take it as one
prop and a data hook can return it as one value.

Deliberately NOT done here:
- No automatic loading on scroll. An intersection trigger moves focus-less
  content under a keyboard reader's feet; the button is the one trigger, and
  DataGrid adds its own ArrowDown-past-the-last-row trigger on top.
- No "End of list" by default. A list that simply stops needs no caption;
  the host opts in with `endLabel`.
- The button swaps its label and busy state in place, which is what keeps
  focus on it while rows append. When the last batch arrives the button goes
  away, so a footer that held focus takes it (`tabIndex={-1}`) instead of
  dropping it to the page, and says why: its `endLabel`, or "End of list" when
  the host gave none. Tab continues after the list, Shift+Tab goes back into it.
--- */

/** The keyset paging contract a list, a lane or a data hook passes around. */
export interface LoadMoreState {
  /** More rows exist beyond the ones already loaded. */
  hasMore: boolean;
  /** Fetch the next batch. Also the retry after an `error`. */
  onLoadMore: () => void;
  /**
   * A fetch is in flight: the button shows a spinner, keeps its width and
   * ignores further presses.
   * @default false
   */
  loading?: boolean;
  /**
   * The last fetch failed. Shown as a message above a "Try again" button;
   * rows already loaded stay.
   * @default undefined
   */
  error?: React.ReactNode;
}

/** Props accepted by `LoadMore`. */
export interface LoadMoreProps extends LoadMoreState {
  /**
   * The button's label while more rows exist.
   * @default "Load more"
   */
  label?: string;
  /**
   * The button's label after an `error`.
   * @default "Try again"
   */
  retryLabel?: string;
  /**
   * What to show once `hasMore` is false. Nothing renders when omitted — unless the button had
   * focus when the list ended, when the footer keeps that focus and reads "End of list".
   * @default undefined
   */
  endLabel?: React.ReactNode;
  /**
   * Classes merged onto the root.
   * @default undefined
   */
  className?: string;
  /**
   * Ref to the root `div`.
   * @default undefined
   */
  ref?: React.Ref<HTMLDivElement>;
}

/**
 * The shared "Load more" footer for keyset lists: an outline button that
 * loads the next batch, a busy state that keeps the button's width, an error
 * line with a retry, and an optional end caption.
 *
 * @example
 * <LoadMore
 *   hasMore={page.nextCursor != null}
 *   loading={isFetching}
 *   error={fetchError ? "Couldn't load more tasks." : undefined}
 *   onLoadMore={fetchNextPage}
 * />
 */
export function LoadMore({
  hasMore,
  onLoadMore,
  loading = false,
  error,
  label = "Load more",
  retryLabel = "Try again",
  endLabel,
  className,
  ref,
}: LoadMoreProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const setRef = React.useMemo(() => mergeRefs(rootRef, ref), [ref]);
  const [heldFocus, setHeldFocus] = React.useState(false);
  const keepFocus = !hasMore && heldFocus;
  React.useEffect(() => {
    if (keepFocus) rootRef.current?.focus();
  }, [keepFocus]);

  if (!hasMore) {
    if (endLabel == null && !keepFocus) return null;
    return (
      <div
        ref={setRef}
        data-slot="load-more"
        data-state="done"
        tabIndex={keepFocus ? -1 : undefined}
        onBlur={() => setHeldFocus(false)}
        className={cn(
          "flex justify-center text-xs text-muted-foreground",
          className,
        )}
      >
        {endLabel ?? "End of list"}
      </div>
    );
  }

  const failed = error != null && error !== false && !loading;
  return (
    <div
      ref={setRef}
      data-slot="load-more"
      data-state={loading ? "loading" : failed ? "error" : "idle"}
      onFocus={() => setHeldFocus(true)}
      onBlur={(event) => {
        // A press while the last batch lands unmounts the button with focus in it; that blur has
        // no next target inside the page, so the hold survives it and the done footer takes focus.
        if (event.relatedTarget) setHeldFocus(false);
      }}
      className={cn("flex flex-col items-center gap-2", className)}
    >
      {failed ? (
        <p
          role="alert"
          data-slot="load-more-error"
          className="text-center text-sm text-destructive-text"
        >
          {error}
        </p>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        loading={loading}
        onClick={loading ? undefined : onLoadMore}
      >
        {failed ? retryLabel : label}
      </Button>
    </div>
  );
}

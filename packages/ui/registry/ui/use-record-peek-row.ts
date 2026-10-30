// @vegastack use-record-peek-row@0.26.3 sha256-hrmSL/ABZLUEhsmR1CMjBMs0JUbYqosU6GC7f+ULVwE=

"use client";

import * as React from "react";

/** What `useRecordPeekRow` returns: spread it on the row element. */
export interface RecordPeekRowProps<T extends HTMLElement> {
  /** Attach to the row, so it can scroll into view when it becomes the open one. */
  ref: React.RefCallback<T>;
  /** `""` on the open row, absent otherwise — the attribute every list styles the same way. */
  "data-peek-active": "" | undefined;
}

/**
 * `useRecordPeekRow` — the open-row contract between a list and `RecordPeek`, for a list the
 * system's own lists don't cover (`DataList`, `DataGrid` and `Board` take `activeRowId` and do this
 * themselves). The row whose `id` equals `activeId` gets `data-peek-active=""` — style it the way
 * the system's lists do, `data-peek-active:bg-accent` — and scrolls into view (`block: "nearest"`)
 * whenever it becomes the open one, so walking the peek with ↑/↓ keeps the row in sight.
 *
 * @example
 * function Row({ task, peekId }: { task: Task; peekId: string | null }) {
 *   const peek = useRecordPeekRow<HTMLDivElement>(task.id, peekId);
 *   return <Item {...peek} className="data-peek-active:bg-accent">{task.title}</Item>;
 * }
 */
export function useRecordPeekRow<T extends HTMLElement = HTMLElement>(
  id: string,
  activeId: string | null | undefined,
): RecordPeekRowProps<T> {
  const active = activeId != null && activeId === id;
  const node = React.useRef<T | null>(null);
  const ref = React.useCallback((element: T | null) => {
    node.current = element;
  }, []);
  React.useEffect(() => {
    if (!active) return;
    node.current?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
  }, [active]);
  return { ref, "data-peek-active": active ? "" : undefined };
}

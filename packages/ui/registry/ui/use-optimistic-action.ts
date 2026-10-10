// @vegastack use-optimistic-action@0.25.12 sha256-uzZYsEr9+yAQT0tLcYtiP9XOQAJUST2a0k9FQn6FIOI=

"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";

/* ---
`use-optimistic-action.ts` is the "do it now, offer Undo, commit later" pattern for reversible,
destructive-feeling actions — archive, delete to trash, move, mark done.

FLOW
1. `run(input)` calls `apply(input)` at once: the UI changes optimistically.
2. A toast says what happened and offers **Undo** for `undoWindowMs`.
3. Undo (the toast button, or `undo()`) calls `revert(input)` and the server is never called.
4. Otherwise, when the window closes, `commit(input)` runs. If it rejects, `revert(input)` runs and
   an error toast offers Retry.

Deferring the commit (rather than committing then compensating) keeps Undo free: nothing has to be
put back on the server. The trade is that a page closed inside the window drops the commit, so the
hook flushes pending commits on `pagehide` and on unmount.
--- */

/** Options for {@link useOptimisticAction}. */
export interface UseOptimisticActionOptions<I> {
  /** Change the UI now — remove the row, flip the flag. */
  apply: (input: I) => void;
  /** Put the UI back. Runs on Undo and when `commit` rejects. */
  revert: (input: I) => void;
  /** Persist the action. Runs once the Undo window closes without an Undo. */
  commit: (input: I) => Promise<unknown> | unknown;
  /** The toast's title — "Task archived", or a function of the input. */
  message: React.ReactNode | ((input: I) => React.ReactNode);
  /**
   * The error toast's title when `commit` rejects.
   * @default "Couldn't save the change"
   */
  errorMessage?:
    React.ReactNode | ((input: I, error: unknown) => React.ReactNode);
  /**
   * How long Undo is offered, in milliseconds; the toast stays up for the same time.
   * @default 5000
   */
  undoWindowMs?: number;
  /**
   * The Undo button's label.
   * @default "Undo"
   */
  undoLabel?: string;
}

/** What {@link useOptimisticAction} returns. */
export interface UseOptimisticActionResult<I> {
  /** Apply the action now and schedule its commit. Returns an id for `undo`. */
  run: (input: I) => string;
  /** Undo a pending action by the id `run` returned, or the most recent one. False if too late. */
  undo: (id?: string) => boolean;
  /** Commit every pending action now, skipping the rest of their windows. */
  flush: () => void;
  /** How many actions are waiting for their window to close. */
  pending: number;
}

interface Pending<I> {
  input: I;
  timer: ReturnType<typeof setTimeout>;
  toastId: string;
}

/**
 * `useOptimisticAction` — apply an action optimistically, offer Undo in a toast, and commit only
 * when the Undo window closes. Needs a mounted `Toaster`.
 *
 * @example
 * const archive = useOptimisticAction({
 *   apply: (task) => setTasks((all) => all.filter((t) => t.id !== task.id)),
 *   revert: (task) => setTasks((all) => [...all, task]),
 *   commit: (task) => api.archive(task.id),
 *   message: (task) => `Archived “${task.title}”`,
 * });
 * <Button onClick={() => archive.run(task)}>Archive</Button>
 */
export function useOptimisticAction<I>(
  options: UseOptimisticActionOptions<I>,
): UseOptimisticActionResult<I> {
  const optionsRef = React.useRef(options);
  optionsRef.current = options;
  const pendingRef = React.useRef(new Map<string, Pending<I>>());
  const [pending, setPending] = React.useState(0);
  const sync = React.useCallback(() => setPending(pendingRef.current.size), []);

  // Retry re-runs the action through the latest `run`, which is declared below.
  const runRef = React.useRef<(input: I) => string>(() => "");
  const commitNow = React.useCallback(
    (id: string) => {
      const entry = pendingRef.current.get(id);
      if (!entry) return;
      pendingRef.current.delete(id);
      clearTimeout(entry.timer);
      toast.close(entry.toastId);
      sync();
      const { commit, revert, errorMessage } = optionsRef.current;
      void Promise.resolve()
        .then(() => commit(entry.input))
        .catch((error: unknown) => {
          revert(entry.input);
          const title =
            typeof errorMessage === "function"
              ? errorMessage(entry.input, error)
              : (errorMessage ?? "Couldn't save the change");
          const errorId = toast.add({
            type: "error",
            title,
            priority: "high",
            data: {
              actions: [
                {
                  label: "Retry",
                  onClick: () => {
                    toast.close(errorId);
                    runRef.current(entry.input);
                  },
                },
              ],
            },
          });
        });
    },
    [sync],
  );

  const undo = React.useCallback(
    (id?: string) => {
      const key = id ?? [...pendingRef.current.keys()].at(-1);
      const entry = key ? pendingRef.current.get(key) : undefined;
      if (!key || !entry) return false;
      pendingRef.current.delete(key);
      clearTimeout(entry.timer);
      toast.close(entry.toastId);
      sync();
      optionsRef.current.revert(entry.input);
      return true;
    },
    [sync],
  );

  const run = React.useCallback(
    (input: I) => {
      const {
        apply,
        message,
        undoWindowMs = 5000,
        undoLabel = "Undo",
      } = optionsRef.current;
      apply(input);
      const id = `optimistic-${Math.random().toString(36).slice(2)}`;
      const toastId = toast.add({
        title: typeof message === "function" ? message(input) : message,
        timeout: undoWindowMs,
        data: { actions: [{ label: undoLabel, onClick: () => undo(id) }] },
      });
      const timer = setTimeout(() => commitNow(id), undoWindowMs);
      pendingRef.current.set(id, { input, timer, toastId });
      sync();
      return id;
    },
    [commitNow, undo, sync],
  );

  runRef.current = run;

  const flush = React.useCallback(() => {
    for (const id of [...pendingRef.current.keys()]) commitNow(id);
  }, [commitNow]);

  React.useEffect(() => {
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  return { run, undo, flush, pending };
}

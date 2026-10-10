// @vegastack use-view-transition@0.25.11 sha256-49T/xSkkxw50Id+GyY0pzvoJqGOh0ywYtZyX35u8wgw=

"use client";

import * as React from "react";
import { flushSync } from "react-dom";

/* ---
`use-view-transition.ts` wraps the View Transitions API (`document.startViewTransition`) for a
React app, Next.js App Router included.

MECHANISM — the browser snapshots the old frame, runs `update`, snapshots the new one and
cross-fades (or morphs elements that share a `view-transition-name`). React batches state
updates, so `update` runs inside `flushSync`: the DOM has to have changed by the time the
callback returns or the browser captures the same frame twice.

FALLBACKS — `update` still runs, synchronously and with no animation, when:
- the browser has no `startViewTransition` (Firefox before 144, older Safari, a test harness);
- the user asked for reduced motion (checked live, not cached);
- a transition is already running and `skipIfRunning` is set.
The CSS side of reduced motion is already owned by `base.css` (MOT-5), which neutralises the
`::view-transition-*` animations; this helper skips the snapshot as well, so nothing flashes.

NEXT.JS — `router.push` is asynchronous, so a route change cannot finish inside `flushSync`.
Pass an async `update` that resolves when the new route has rendered (see the docs guide), or use
Next's `experimental.viewTransition` flag with React's `<ViewTransition>`; this helper covers the
in-page state changes (switching a view, reordering a list, opening a detail pane).
--- */

type ViewTransitionLike = {
  finished: Promise<void>;
  ready: Promise<void>;
  updateCallbackDone: Promise<void>;
  skipTransition: () => void;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (
    update: () => void | Promise<void>,
  ) => ViewTransitionLike;
};

/** Options for {@link startViewTransition} and {@link useViewTransition}. */
export interface ViewTransitionOptions {
  /**
   * Run `update` without a transition while another view transition is still animating, rather
   * than interrupting it.
   * @default false
   */
  skipIfRunning?: boolean;
}

let running: ViewTransitionLike | null = null;

/** Whether this browser can run a view transition at all. False on the server. */
export function supportsViewTransitions(): boolean {
  return (
    typeof document !== "undefined" &&
    typeof (document as DocumentWithViewTransition).startViewTransition ===
      "function"
  );
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Run `update` inside a view transition when the browser supports one and the user has not asked
 * for reduced motion; otherwise run it directly. Resolves when the DOM update is done (not when the
 * animation finishes), so the caller can move focus straight away.
 *
 * A synchronous `update` is flushed with `flushSync` so React commits inside the snapshot window.
 *
 * @example
 * await startViewTransition(() => setView("grid"));
 */
export async function startViewTransition(
  update: () => void | Promise<void>,
  { skipIfRunning = false }: ViewTransitionOptions = {},
): Promise<void> {
  if (
    !supportsViewTransitions() ||
    prefersReducedMotion() ||
    (skipIfRunning && running)
  ) {
    await update();
    return;
  }
  const doc = document as DocumentWithViewTransition;
  const transition = doc.startViewTransition!(() => {
    let result: void | Promise<void> = undefined;
    flushSync(() => {
      result = update();
    });
    return result;
  });
  running = transition;
  transition.finished.finally(() => {
    if (running === transition) running = null;
  });
  // A rejected `ready` (the transition was skipped) is not an error for the caller.
  transition.ready.catch(() => {});
  await transition.updateCallbackDone;
}

/** What {@link useViewTransition} returns. */
export interface UseViewTransitionResult {
  /** `startViewTransition`, bound to the hook's options. Stable across renders. */
  start: (update: () => void | Promise<void>) => Promise<void>;
  /** True while a transition started by this hook is updating the DOM. */
  pending: boolean;
}

/**
 * `useViewTransition` — the hook form of {@link startViewTransition}, with a `pending` flag for the
 * frames while the update runs.
 *
 * @example
 * const { start } = useViewTransition();
 * <ViewToggle value={view} onValueChange={(next) => start(() => setView(next))} />
 */
export function useViewTransition(
  options: ViewTransitionOptions = {},
): UseViewTransitionResult {
  const [pending, setPending] = React.useState(false);
  const { skipIfRunning } = options;
  const start = React.useCallback(
    async (update: () => void | Promise<void>) => {
      setPending(true);
      try {
        await startViewTransition(update, { skipIfRunning });
      } finally {
        setPending(false);
      }
    },
    [skipIfRunning],
  );
  return { start, pending };
}

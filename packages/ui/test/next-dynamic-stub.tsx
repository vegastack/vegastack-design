/**
 * `next/dynamic` stand-in for the vitest browser lane.
 *
 * One preview fixture (`apps/docs/components/preview/text-edit.tsx`) wraps its component in
 * `next/dynamic(..., { ssr: false })` to keep Tiptap out of the docs barrel's initial module
 * graph. That is a Next bundler concern with no meaning in a vitest browser run, and importing
 * the real `next/dynamic` would drag the Next runtime into a lane that deliberately has no Next.
 *
 * `React.lazy` + `Suspense` is the exact browser-side equivalent of what `next/dynamic` produces
 * once hydrated, so the fixture mounts identically and its geometry is unchanged. Aliased in
 * `vitest.config.ts`; nothing outside the test lane sees this file.
 *
 * WHY THIS FILE TRACKS ITS OWN MOUNTS
 *   A lazy boundary renders its FALLBACK first — for TextEdit, which passes no `loading`, that is
 *   nothing at all. A sweep that measured that empty frame would report a green result for a
 *   component that never rendered: no contenteditable to overflow, no toolbar control to be
 *   under 24px. Every geometry assertion would pass vacuously.
 *
 *   So the stub counts the dynamic components that mounted and the loader promises still in
 *   flight, and `geometry.browser.test.tsx` uses both: a fixture with a dynamic mount MUST
 *   declare the DOM that proves the real component arrived, and the sweep waits for it — or
 *   fails. The counters live here rather than in the test because only this module can see a
 *   `next/dynamic` boundary at all.
 */
import * as React from "react";

type Loader<P> = () => Promise<React.ComponentType<P>>;

const mounted = new Set<string>();
const pending = new Set<Promise<unknown>>();

/**
 * How many distinct `next/dynamic` boundaries have rendered since the last reset. Counted by
 * `useId`, which is stable per component instance, so a re-render does not inflate the number —
 * the sweep compares it against how many real components appeared in the DOM.
 */
export const dynamicMountCount = () => mounted.size;

/** How many dynamic import loaders are still in flight. */
export const pendingDynamicImports = () => pending.size;

/** Called from the sweep's `beforeEach`, so counts are per fixture. */
export function resetDynamicTracking() {
  mounted.clear();
  pending.clear();
}

export default function dynamic<P extends object>(
  loader: Loader<P>,
  options: { loading?: React.ComponentType } = {},
): React.ComponentType<P> {
  const Lazy = React.lazy(async () => {
    const promise = loader();
    pending.add(promise);
    try {
      return { default: await promise };
    } finally {
      pending.delete(promise);
    }
  });
  const Loading = options.loading;
  return function DynamicComponent(props: P) {
    // Recorded on render, not in an effect: the fallback frame IS a render, and that is precisely
    // the frame the sweep must not measure — by the time an effect ran it would be too late.
    mounted.add(React.useId());
    return (
      <React.Suspense fallback={Loading ? <Loading /> : null}>
        <Lazy {...props} />
      </React.Suspense>
    );
  };
}

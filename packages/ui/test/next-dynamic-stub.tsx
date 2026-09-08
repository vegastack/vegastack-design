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
 */
import * as React from "react";

type Loader<P> = () => Promise<React.ComponentType<P>>;

export default function dynamic<P extends object>(
  loader: Loader<P>,
  options: { loading?: React.ComponentType } = {},
): React.ComponentType<P> {
  const Lazy = React.lazy(async () => ({ default: await loader() }));
  const Loading = options.loading;
  return function DynamicComponent(props: P) {
    return (
      <React.Suspense fallback={Loading ? <Loading /> : null}>
        <Lazy {...props} />
      </React.Suspense>
    );
  };
}

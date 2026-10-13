// @vegastack status-pages-01@0.25.30 sha256-luOl3LjgQ+r5GRvKTk4yCi/4qJC+tMedHfs23n9wwiM=

import { NotFoundPage } from "./components/not-found-page";

/**
 * `status-pages-01` — the three status pages an app needs, 404, 403 and error, each an `Empty`
 * whose title is the page's one `h1`. This page shows the 404 on its own, the way a root
 * `not-found.tsx` renders it. Copy the part you need into each boundary file:
 *
 * - `app/not-found.tsx` → `<NotFoundPage standalone />`; `app/(app)/not-found.tsx` → `<NotFoundPage />`
 * - `app/forbidden.tsx` → `<ForbiddenPage standalone />`; `app/(app)/forbidden.tsx` → `<ForbiddenPage />`
 * - `app/global-error.tsx` → `<ErrorPage standalone … />`; `app/(app)/error.tsx` → `<ErrorPage digest={error.digest} onRetry={reset} />`
 *
 * @example
 * // app/not-found.tsx, straight after `shadcn add @vegastack/status-pages-01`
 * export { NotFoundPage as default } from "./components/not-found-page";
 */
export default function Page() {
  return <NotFoundPage standalone />;
}

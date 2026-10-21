// @vegastack status-pages-01@0.25.64 sha256-nmwkygPQ26GLvxaVnZdET1Zr6fNLxfJrAOoeE7T4Lyo=

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

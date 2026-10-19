// @vegastack library-01@0.25.45 sha256-keGF3E8fBs7d6lpUZKT2+xX5LfgOgPp/5yYQYtBGD3E=

import { Library } from "./components/library";

/**
 * `library-01` — a file library page: the `FolderTree` pane beside the open folder's breadcrumb,
 * header, uploads in flight and contents (list or grid), with the `FileViewer` and a Move dialog.
 *
 * Server-safe: the interactive half is the client leaf it imports. Replace the sample library with
 * your API and each href with your routes.
 *
 * @example
 * // app/library/page.tsx, straight after `shadcn add @vegastack/library-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <div className="h-dvh p-4">
      <Library />
    </div>
  );
}

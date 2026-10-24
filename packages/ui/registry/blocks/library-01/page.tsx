// @vegastack library-01@0.25.74 sha256-U30jW8doSVu+FWLHlQS6EuiHFyucVbc9ZbG8CCc7m3w=

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

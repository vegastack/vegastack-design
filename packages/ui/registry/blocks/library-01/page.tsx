// @vegastack library-01@0.25.72 sha256-OYjTD6owkBJ8gHhf0u5iH/DJW8Qha57Qpw2FVYb/20o=

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

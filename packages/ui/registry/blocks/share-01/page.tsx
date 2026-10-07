// @vegastack share-01@0.24.2 sha256-dlFR5lNrDlvu3gNakaRgf+ns73pCqs9QLSDFV8EJLz8=

import { ShareDemo } from "./components/share-demo";

/**
 * `share-01` — the Share dialog for one item, with Share and Publish tabs: invite people and teams
 * with one access level for the batch, the people who have access and why, the item's space access,
 * and — only through the Publish switch — a view-only public link. A Dialog on wide screens and a
 * bottom sheet on phones.
 *
 * Server-safe: the interactive half is the client leaf it imports.
 *
 * @example
 * // app/share-01/page.tsx, straight after `shadcn add @vegastack/share-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <ShareDemo />
    </div>
  );
}

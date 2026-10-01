// @vegastack share-01@0.23.111 sha256-4mjWpy9wUts0gz3zKMxvlwTENeN0+ErcNk6Bzbo9TYM=

import { ShareDemo } from "./components/share-demo";

/**
 * `share-01` — the Share dialog for one item: invite people and teams with one access level for
 * the batch, the people who have access and why, the item's general access in its space, and a
 * view-only public link. A Dialog on wide screens and a bottom Sheet on phones.
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

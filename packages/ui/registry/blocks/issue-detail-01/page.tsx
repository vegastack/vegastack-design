// @vegastack issue-detail-01@0.135.0 sha256-opODO8JpTAOBTkPLNI7yTAxnuPnHqXRpN34MsEB2jGY=

import { IssueDetail } from "./components/issue-detail";
import { ShellPage } from "@/components/ui/shell";

/**
 * `issue-detail-01` — an issue's page (Linear style): the status circle beside a large title that
 * edits in place, its properties, a Notion-style description, a separator, then the comments — one
 * column, the same body a peek shows.
 *
 * Server-safe: the interactive half is the client leaf it imports.
 *
 * @example
 * // app/tasks/[id]/page.tsx, straight after `shadcn add @vegastack/issue-detail-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <ShellPage size="full">
      <IssueDetail />
    </ShellPage>
  );
}

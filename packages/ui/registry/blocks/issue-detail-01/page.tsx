// @vegastack issue-detail-01@0.90.0 sha256-FzjJL2gNUh5f/NdAxkt21omAdacuAD8UoQOG5QSiL2E=

import { IssueDetail } from "./components/issue-detail";
import { ShellPage } from "@/components/ui/shell";

/**
 * `issue-detail-01` — an issue's page (Linear style): the status circle beside a large title that
 * edits in place, a Notion-style description, a separator, then the comments; the Properties card
 * in a sticky right rail, and an ⓘ Details sheet in its place on small screens.
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

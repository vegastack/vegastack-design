// @vegastack issue-detail-01@0.101.0 sha256-npEsEi0xo0VMLsUjE5l/3GeXu0tHi916VzV7yZz7MLs=

import { IssueDetail } from "./components/issue-detail";
import { ShellPage } from "@/components/ui/shell";

/**
 * `issue-detail-01` — an issue's page (Linear style): the status circle beside a large title that
 * edits in place, its properties, a Notion-style description, a separator, then the comments — one
 * column, the same body a shell panel tab shows.
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

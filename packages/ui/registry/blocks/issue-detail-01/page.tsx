// @vegastack issue-detail-01@0.25.12 sha256-n1SgX8r8M9nYLrvj5+Ls6oCjZr5p8MrrTu2aJIk6RrY=

import { IssueDetail } from "./components/issue-detail";
import { AppShellPage } from "@/components/ui/app-shell";

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
    <AppShellPage size="full">
      <IssueDetail />
    </AppShellPage>
  );
}

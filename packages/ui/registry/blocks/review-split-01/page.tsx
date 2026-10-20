// @vegastack review-split-01@0.25.50 sha256-d+CqeCpHzSY3pfmEq1Hei1S/676J/z3ulB/t17yA0mI=

import { AppShellPage } from "@/components/ui/app-shell";
import { PageHeader } from "@/components/ui/page-header";

import { ReviewSplit } from "./components/review-split";
import {
  ACTION_ITEMS,
  RECORDING_SRC,
  SEGMENTS,
  SPEAKERS,
  SUMMARY,
} from "./components/sample-meeting";

/**
 * `review-split-01` — a record's review page: a `PageHeader` h1 over `ReviewSplit`, the two-pane
 * summary + transcript layout that turns into tabs when its own container is narrow. It fills the
 * content region (`AppShellPage size="full"`).
 *
 * Replace the sample meeting with your record and `RECORDING_SRC` with its recording.
 *
 * @example
 * // app/meetings/[id]/page.tsx, straight after `shadcn add @vegastack/review-split-01`
 * export { default } from "./page";
 */
export default function Page() {
  return (
    <AppShellPage size="full">
      <PageHeader
        title="Weekly sync with Skyline"
        description="Tuesday 3 September · 34 minutes · Ana Ruiz, Raj Patel, Mei Chen"
      />
      <ReviewSplit
        summary={SUMMARY}
        actionItems={ACTION_ITEMS}
        segments={SEGMENTS}
        speakers={SPEAKERS}
        recordingSrc={RECORDING_SRC}
      />
    </AppShellPage>
  );
}

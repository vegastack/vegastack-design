"use client";

/**
 * `preview/review-split-01.tsx` — the docs live preview for the `review-split-01` registry block.
 *
 * Imports the REAL block source (a cross-package relative import, not a copy): a block is not
 * `shadcn add`-ed into `apps/docs/components/ui/*` the way a component is — there is nothing to
 * add, this demonstrates the pre-install block itself. Its own `@/components/ui/*` imports still
 * resolve to the docs app's copy-in, exactly like every other preview here.
 */

import type { ReactNode } from "react";
import { ReviewSplit } from "../../../../packages/ui/registry/blocks/review-split-01/components/review-split";
import {
  ACTION_ITEMS,
  SEGMENTS,
  SPEAKERS,
  SUMMARY,
} from "../../../../packages/ui/registry/blocks/review-split-01/components/sample-meeting";
import { PageHeader } from "@/components/ui/page-header";
import { Wrapper } from "./wrapper";

// The block's page plays `/recordings/weekly-sync.mp3`, which the docs site doesn't serve; the
// preview composes the same page around the docs' own sample recording.
export function reviewSplit01Demo(): ReactNode {
  return (
    <Wrapper className="block h-160 overflow-auto p-4 md:p-6">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Weekly sync with Skyline"
          description="Tuesday 3 September · 34 minutes · Ana Ruiz, Raj Patel, Mei Chen"
        />
        <ReviewSplit
          summary={SUMMARY}
          actionItems={ACTION_ITEMS}
          segments={SEGMENTS}
          speakers={SPEAKERS}
          recordingSrc="/preview/media-player-demo.wav"
        />
      </div>
    </Wrapper>
  );
}

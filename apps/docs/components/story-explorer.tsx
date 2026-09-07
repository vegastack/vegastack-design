import type { ReactNode } from "react";

/**
 * Frame for the Fumadocs Story "Explorer" (DC-11/DD-3). The explorer is sanctioned ONLY on a
 * page with no curated `PropsPlayground`; there it renders inside the same centred,
 * product-scale frame every other live demo uses instead of stretching the subject edge to
 * edge. `tooling/verify-docs-export.mjs` fails a page that carries both an explorer and a
 * playground.
 *
 *   <StoryExplorer>
 *     <story.WithControl />
 *   </StoryExplorer>
 */
export function StoryExplorer({ children }: { children: ReactNode }) {
  return (
    <div
      data-story-explorer=""
      className="vs-type-product not-prose my-4 overflow-hidden rounded-lg border border-border bg-card [&>div]:border-0 [&>div>*:nth-child(2)]:flex [&>div>*:nth-child(2)]:min-h-32 [&>div>*:nth-child(2)]:items-center [&>div>*:nth-child(2)]:justify-center [&>div>*:nth-child(2)]:p-6"
    >
      {children}
    </div>
  );
}

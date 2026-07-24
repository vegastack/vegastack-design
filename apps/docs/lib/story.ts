import { defineStoryFactory } from "@fumadocs/story/next/client";

/**
 * Fumadocs Story factory — `defineStory` powers the auto-generated "Explorer" panels on
 * component pages (`components/stories/*.story.tsx`). Controls are generated from each
 * component's TypeScript prop types by the build-time plugin registered in `next.config.mjs`.
 * The curated PropsPlayground stays the primary interactive demo (copyable JSX, hand-picked
 * axes); Story is the exhaustive full-prop-surface explorer beside it.
 */
export const { defineStory } = defineStoryFactory();

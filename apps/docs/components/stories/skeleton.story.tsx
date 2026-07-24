import { defineStory } from "@/lib/story";
import { Skeleton } from "./skeleton.client";

/**
 * Story explorer for `Skeleton` — controls auto-generated from `SkeletonProps` by the
 * Story build plugin. Explores `shape` and `count` (the stacked-paragraph form).
 */
export const story = defineStory({
  Component: Skeleton,
  args: [
    {
      variant: "Default",
      initial: {
        shape: "line",
      },
    },
    {
      variant: "Paragraph",
      initial: {
        shape: "line",
        count: 3,
      },
    },
    {
      variant: "Circle",
      fixed: {
        shape: "circle",
      },
    },
  ],
});

import { defineStory } from "@/lib/story";
import { ProgressIndicator } from "./progress-indicator.client";

/**
 * Story explorer for `ProgressIndicator` — controls auto-generated from
 * `ProgressIndicatorProps` by the Story build plugin.
 */
export const story = defineStory({
  Component: ProgressIndicator,
  args: [
    {
      variant: "Default",
      initial: {
        value: 60,
      },
    },
    {
      variant: "Squircle",
      initial: {
        value: 60,
        size: "lg",
      },
      fixed: {
        shape: "squircle",
      },
    },
  ],
});

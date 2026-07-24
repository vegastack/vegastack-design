import { defineStory } from "@/lib/story";
import { Toggle } from "@/components/ui/toggle";

/**
 * Story explorer for `Toggle` — controls auto-generated from `ToggleProps` by the Story
 * build plugin. Uncontrolled via `defaultPressed`, with a text child so the two-state
 * press is visible without an icon.
 */
export const story = defineStory({
  Component: Toggle,
  args: [
    {
      variant: "Default",
      initial: {
        children: "Bold",
      },
    },
    {
      variant: "Pressed",
      initial: {
        children: "Italic",
        defaultPressed: true,
      },
    },
  ],
});

import { defineStory } from "@/lib/story";
import { Slider } from "./slider.client";

/**
 * Story explorer for `Slider` — controls auto-generated from the component's props by the Story
 * build plugin. Uncontrolled via `defaultValue`; pass an array for a range. Upstream's Slider
 * labels its thumbs through one `aria-label` on the root — there is no per-thumb label prop — so
 * the Range variant carries a single group label.
 */
export const story = defineStory({
  Component: Slider,
  args: [
    {
      variant: "Default",
      initial: {
        defaultValue: 40,
        "aria-label": "Volume",
      },
    },
    {
      variant: "Range",
      initial: {
        "aria-label": "Price",
      },
      fixed: {
        defaultValue: [20, 80],
      },
    },
  ],
});

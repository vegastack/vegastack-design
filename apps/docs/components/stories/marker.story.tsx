import { defineStory } from "@/lib/story";
import { Marker } from "@/components/ui/marker";

/**
 * Story explorer for `Marker` — controls auto-generated from `MarkerProps` by the
 * Story build plugin. Text children render directly; compose `MarkerIcon` /
 * `MarkerContent` in real usage.
 */
export const story = defineStory({
  Component: Marker,
  args: [
    {
      variant: "Default",
      initial: {
        children: "Deployed to production",
      },
    },
    {
      variant: "Separator",
      initial: {
        children: "Today",
      },
      fixed: {
        variant: "separator",
      },
    },
  ],
});
